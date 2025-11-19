import { existsSync } from 'fs';
import { join } from 'path';

import { Injectable, BadRequestException, Logger } from '@nestjs/common';


@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  
    getStaticProductImage( imageName: string ) {
        this.logger.debug(`[GET-IMAGE] Buscando imagen - Nombre: ${imageName}`);
        const path = join( process.cwd(), 'static/products', imageName );

        if ( !existsSync(path) ) {
            this.logger.warn(`[GET-IMAGE] Imagen no encontrada - Ruta: ${path}`);
            throw new BadRequestException(`No product found with image ${ imageName }`);
        }

        this.logger.log(`[GET-IMAGE] Imagen encontrada - Ruta: ${path}`);
        return path;
    }


}