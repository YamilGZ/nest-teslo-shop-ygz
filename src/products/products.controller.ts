import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';
import { Product } from './entities';

@ApiTags('Products - Gestión de Productos')
@Controller('products')
@Auth()
@ApiBearerAuth()
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth()
  @ApiOperation({ 
    summary: 'Crear un nuevo producto',
    description: 'Crea un nuevo producto en el sistema. Requiere autenticación. El slug se genera automáticamente si no se proporciona.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Producto creado exitosamente', 
    type: Product
  })
  @ApiResponse({ status: 400, description: 'Error de validación o título/slug duplicado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Token inválido' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ) {
    this.logger.log(`[CREATE] Creando producto - Título: ${createProductDto.title}, User ID: ${user.id}`);
    try {
      const result = await this.productsService.create(createProductDto, user);
      this.logger.log(`[CREATE] Producto creado exitosamente - Título: ${createProductDto.title}`);
      return result;
    } catch (error) {
      this.logger.error(`[CREATE] Error al crear producto - Título: ${createProductDto.title}`, error.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todos los productos',
    description: 'Retorna una lista paginada de productos. Soporta paginación con limit y offset.'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Número de productos a retornar (default: 10)',
    example: 10
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    type: Number, 
    description: 'Número de productos a omitir (default: 0)',
    example: 0
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8',
            title: "Men's Chill Crew Neck Sweatshirt",
            price: 75,
            description: 'Introducing the Tesla Chill Collection...',
            slug: 'mens_chill_crew_neck_sweatshirt',
            stock: 7,
            sizes: ['XS','S','M','L','XL','XXL'],
            gender: 'men',
            tags: ['sweatshirt'],
            images: []
          }
        ],
        total: 50,
        limit: 10,
        offset: 0
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll( @Query() paginationDto: PaginationDto) {
    this.logger.log(`[FIND-ALL] Obteniendo productos - Limit: ${paginationDto.limit || 10}, Offset: ${paginationDto.offset || 0}`);
    try {
      const result = await this.productsService.findAll(paginationDto);
      this.logger.log(`[FIND-ALL] Productos obtenidos exitosamente`);
      return result;
    } catch (error) {
      this.logger.error(`[FIND-ALL] Error al obtener productos`, error.stack);
      throw error;
    }
  }

  @Get(':term')
  @ApiOperation({ 
    summary: 'Buscar producto por término',
    description: 'Busca un producto por su ID, slug o título. Retorna el producto con sus imágenes relacionadas.'
  })
  @ApiParam({ 
    name: 'term', 
    description: 'ID (UUID), slug o título del producto',
    example: 'mens_chill_crew_neck_sweatshirt'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto encontrado',
    type: Product
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findOne(@Param('term') term: string) {
    this.logger.log(`[FIND-ONE] Buscando producto - Término: ${term}`);
    try {
      const result = await this.productsService.findOnePlain(term);
      this.logger.log(`[FIND-ONE] Producto encontrado - Término: ${term}`);
      return result;
    } catch (error) {
      this.logger.warn(`[FIND-ONE] Producto no encontrado - Término: ${term} - ${error.message}`);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar un producto',
    description: 'Actualiza parcialmente un producto existente. Solo se actualizan los campos proporcionados.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID (UUID) del producto a actualizar',
    example: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto actualizado exitosamente',
    type: Product
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User, 
  ) {
    this.logger.log(`[UPDATE] Actualizando producto - ID: ${id}, User ID: ${user.id}`);
    try {
      const result = await this.productsService.update(id, updateProductDto, user);
      this.logger.log(`[UPDATE] Producto actualizado exitosamente - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`[UPDATE] Error al actualizar producto - ID: ${id}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar un producto',
    description: 'Elimina un producto del sistema. También elimina las imágenes asociadas.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID (UUID) del producto a eliminar',
    example: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto eliminado exitosamente',
    schema: {
      example: {
        message: 'Producto eliminado correctamente'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async remove(@Param('id') id: string) {
    this.logger.log(`[DELETE] Eliminando producto - ID: ${id}`);
    try {
      const result = await this.productsService.remove(id);
      this.logger.log(`[DELETE] Producto eliminado exitosamente - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`[DELETE] Error al eliminar producto - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
