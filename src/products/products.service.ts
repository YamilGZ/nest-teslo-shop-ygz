import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      this.logger.debug(`[CREATE] Creando producto - Título: ${createProductDto.title}, User ID: ${user.id}`);
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
          ...productDetails,
        images: images.map( image => this.productImageRepository.create({ url: image }) ),
        user: user
      });

      await this.productRepository.save(product);
      this.logger.log(`[CREATE] Producto guardado en BD - ID: ${product.id}, Título: ${product.title}, Imágenes: ${images.length}`);

      return {...product, images};

    } catch (error) {
      this.logger.error(`[CREATE] Error al crear producto - Título: ${createProductDto.title}`, error.stack);
      this.handleDBExceptions(error);
    }
  }

  async findAll( paginationDto: PaginationDto ) {
    const { limit = 10, offset = 0 } = paginationDto;
    this.logger.debug(`[FIND-ALL] Buscando productos - Limit: ${limit}, Offset: ${offset}`);

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    })

    this.logger.log(`[FIND-ALL] Productos encontrados: ${products.length}`);

    return products.map( ( product ) => ({
      ...product,
      images: product.images?.map( img => img.url )
    }))

  }

  async findOne(term: string) {
    this.logger.debug(`[FIND-ONE] Buscando producto - Término: ${term}, Es UUID: ${isUUID(term)}`);

    let product: Product | null;

    if ( isUUID(term) ) {
      this.logger.debug(`[FIND-ONE] Buscando por ID`);
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      this.logger.debug(`[FIND-ONE] Buscando por título o slug`);
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); 
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if ( !product ) {
      this.logger.warn(`[FIND-ONE] Producto no encontrado - Término: ${term}`);
      throw new NotFoundException(`Product with ${ term } not found`);
    }

    this.logger.log(`[FIND-ONE] Producto encontrado - ID: ${product.id}, Título: ${product.title}`);
    return product;
  }

  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( image => image.url )
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    this.logger.debug(`[UPDATE] Actualizando producto - ID: ${id}, User ID: ${user.id}`);
    const { images = [], ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate });

    if ( !product ) {
      this.logger.warn(`[UPDATE] Producto no encontrado - ID: ${id}`);
      throw new NotFoundException(`Product with id: ${ id } not found`);
    }

     // Create query runner
     const queryRunner = this.dataSource.createQueryRunner();
     await queryRunner.connect();
     await queryRunner.startTransaction();

    try {
      if( images && images.length > 0 ) {
        this.logger.debug(`[UPDATE] Actualizando ${images.length} imágenes`);
        await queryRunner.manager.delete( ProductImage, { product: { id } });

        product.images = images.map( 
          image => this.productImageRepository.create({ url: image }) 
        )
      }
      
      product.user = user;
      await queryRunner.manager.save( product );
      this.logger.log(`[UPDATE] Producto actualizado en BD - ID: ${id}`);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain( id );
      
    } catch (error) {
      this.logger.error(`[UPDATE] Error al actualizar producto - ID: ${id}`, error.stack);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }

  }

  async remove(id: string) {
    this.logger.debug(`[DELETE] Eliminando producto - ID: ${id}`);
    const product = await this.findOne( id );
    await this.productRepository.remove( product );
    this.logger.log(`[DELETE] Producto eliminado de BD - ID: ${id}, Título: ${product.title}`);
  }

  private handleDBExceptions( error: any ) {
    if ( error.code === '23505' ) {
      this.logger.error(`[DB-ERROR] Violación de constraint único - Code: ${error.code}, Detail: ${error.detail}`);
      throw new BadRequestException(error.detail);
    }
    
    this.logger.error(`[DB-ERROR] Error inesperado en BD`, error.stack);
    console.error('Error completo:', error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

}
