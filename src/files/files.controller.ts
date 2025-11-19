import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, BadRequestException, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';

import type { Response } from 'express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';

import { fileFilter, fileNamer } from './helpers';

@ApiTags('Files - Gestión de Archivos e Imágenes')
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Get('product/:imageName')
  @ApiOperation({ 
    summary: 'Obtener imagen de producto',
    description: 'Retorna la imagen de un producto almacenada en el servidor. Las imágenes se encuentran en la carpeta static/products.'
  })
  @ApiParam({ 
    name: 'imageName', 
    description: 'Nombre del archivo de imagen',
    example: '1740176-00-A_0_2000.jpg'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Imagen encontrada y retornada',
    content: {
      'image/jpeg': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      },
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
  ) {
    this.logger.log(`[GET-IMAGE] Solicitando imagen - Nombre: ${imageName}`);
    try {
      const path = this.filesService.getStaticProductImage( imageName );
      this.logger.log(`[GET-IMAGE] Imagen encontrada - Nombre: ${imageName}`);
      res.sendFile( path );
    } catch (error) {
      this.logger.error(`[GET-IMAGE] Error al obtener imagen - Nombre: ${imageName}`, error.stack);
      throw error;
    }
  }



  @Post('product')
  @UseInterceptors( FileInterceptor('file', {
    fileFilter: fileFilter,
    // limits: { fileSize: 1000 }
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
  }) )
  @ApiOperation({ 
    summary: 'Subir imagen de producto',
    description: 'Sube una imagen para un producto. Solo acepta archivos de imagen (jpg, jpeg, png, gif). El archivo se guarda con un nombre único en la carpeta static/products.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, gif)'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Imagen subida exitosamente',
    schema: {
      example: {
        secureUrl: 'http://localhost:3000/api/files/product/1740176-00-A_0_2000.jpg'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Archivo no válido o no es una imagen' })
  uploadProductImage( 
    @UploadedFile() file: Express.Multer.File,
  ){
    this.logger.log(`[UPLOAD] Intento de subida de imagen - Nombre original: ${file?.originalname || 'N/A'}, Tamaño: ${file?.size || 0} bytes`);

    if ( !file ) {
      this.logger.warn(`[UPLOAD] Archivo no proporcionado o no válido`);
      throw new BadRequestException('Make sure that the file is an image');
    }

    const hostApi = this.configService.get('HOST_API') || 'http://localhost:3000/api';
    const secureUrl = `${ hostApi }/files/product/${ file.filename }`;
    
    this.logger.log(`[UPLOAD] Imagen subida exitosamente - Nombre: ${file.filename}, URL: ${secureUrl}`);

    return { secureUrl };
  }

}