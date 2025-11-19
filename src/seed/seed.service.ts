import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ProductsService } from './../products/products.service';
import { initialData } from './data/seed-data';
import { User } from 'src/auth/entities/user.entity';


@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly productsService: ProductsService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async runSeed() {
    this.logger.log(`[RUN-SEED] Iniciando proceso de seed`);
    
    this.logger.log(`[RUN-SEED] Paso 1: Eliminando datos existentes`);
    await this.deleteTables();
    
    this.logger.log(`[RUN-SEED] Paso 2: Insertando usuarios`);
    const adminUser = await this.insertUsers();
    this.logger.log(`[RUN-SEED] Usuario admin creado - ID: ${adminUser.id}, Email: ${adminUser.email}`);
    
    this.logger.log(`[RUN-SEED] Paso 3: Insertando productos`);
    await this.insertNewProducts( adminUser );

    this.logger.log(`[RUN-SEED] Seed completado exitosamente`);
    return 'SEED EXECUTED';
  }

  private async deleteTables() {
    this.logger.debug(`[DELETE-TABLES] Eliminando productos`);
    await this.productsService.deleteAllProducts();
    this.logger.log(`[DELETE-TABLES] Productos eliminados`);

    this.logger.debug(`[DELETE-TABLES] Eliminando usuarios`);
    const queryBuilder = this.userRepository.createQueryBuilder();
    const result = await queryBuilder.delete().where({}).execute();
    this.logger.log(`[DELETE-TABLES] Usuarios eliminados - Cantidad: ${result.affected || 0}`);
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    this.logger.debug(`[INSERT-USERS] Insertando ${seedUsers.length} usuarios`);
    
    const users: User[] = [];

    seedUsers.forEach( user => {
      users.push( this.userRepository.create( user ) )
    });

    const dbUsers = await this.userRepository.save( seedUsers );
    this.logger.log(`[INSERT-USERS] ${dbUsers.length} usuarios insertados exitosamente`);

    return dbUsers[0];
  }

  private async insertNewProducts( user: User ) {
    this.logger.debug(`[INSERT-PRODUCTS] Eliminando productos existentes antes de insertar nuevos`);
    await this.productsService.deleteAllProducts();

    const products = initialData.products;
    this.logger.debug(`[INSERT-PRODUCTS] Insertando ${products.length} productos`);

    const insertPromises: Promise<any>[] = [];

    products.forEach( (product, index) => {
      this.logger.debug(`[INSERT-PRODUCTS] Preparando producto ${index + 1}/${products.length} - ${product.title}`);
      insertPromises.push( this.productsService.create( product, user ) );
    });

    await Promise.all( insertPromises );
    this.logger.log(`[INSERT-PRODUCTS] ${products.length} productos insertados exitosamente`);

    return true;
  }


}