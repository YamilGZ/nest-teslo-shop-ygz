import { Controller, Get, Logger } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Seed - Poblado de Base de Datos')
@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  constructor(private readonly seedService: SeedService) {}

  @Get()
  //@Auth(ValidRoles.superUser)
  @ApiOperation({ 
    summary: 'Ejecutar seed de base de datos',
    description: 'Ejecuta el seed que limpia la base de datos y la puebla con datos de ejemplo. Crea 2 usuarios de prueba y 50 productos de ejemplo con diferentes categorías (men, women, kid, unisex).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Seed ejecutado exitosamente',
    schema: {
      example: {
        message: 'SEED EXECUTED'
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error al ejecutar el seed' })
  async executeSeed() {
    this.logger.log(`[SEED] Iniciando ejecución de seed`);
    try {
      const result = await this.seedService.runSeed();
      this.logger.log(`[SEED] Seed ejecutado exitosamente`);
      return result;
    } catch (error) {
      this.logger.error(`[SEED] Error al ejecutar seed`, error.stack);
      throw error;
    }
  }
}
