import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateProductDto {

    @ApiProperty({
        description: 'Título del producto (único)',
        example: "Men's Chill Crew Neck Sweatshirt",
        nullable: false,
        minLength: 1
    })
    @IsString()
    @MinLength(1)
    title: string;

    @ApiProperty({
        description: 'Precio del producto',
        example: 75,
        minimum: 0
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @ApiProperty({
        description: 'Descripción del producto',
        example: "Introducing the Tesla Chill Collection. The Men's Chill Crew Neck Sweatshirt has a premium, heavyweight exterior and soft fleece interior for comfort in any season.",
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Slug del producto (se genera automáticamente si no se proporciona)',
        example: 'mens_chill_crew_neck_sweatshirt',
        required: false
    })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty({
        description: 'Stock disponible del producto',
        example: 10,
        minimum: 0
    })
    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?: number; 

    @ApiProperty({
        description: 'Tallas disponibles del producto',
        example: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        type: [String]
    })
    @IsString({ each: true })
    @IsArray()
    sizes: string[]

    @ApiProperty({
        description: 'Género del producto',
        example: 'men',
        enum: ['men', 'women', 'kid', 'unisex']
    })
    @IsIn(['men','women','kid','unisex'])
    gender: string;

    @ApiProperty({
        description: 'Tags del producto',
        example: ['sweatshirt', 'winter'],
        type: [String],
        required: false
    })
    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    tags: string[];

    @ApiProperty({
        description: 'URLs de las imágenes del producto',
        example: ['http://localhost:3000/api/files/product/1740176-00-A_0_2000.jpg'],
        type: [String],
        required: false
    })
    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    images?: string[];
}
