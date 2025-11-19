import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";


export class CreateUserDto {

    @ApiProperty({
        description: 'Email del usuario (debe ser único)',
        example: 'nuevo.usuario@ejemplo.com',
        uniqueItems: true
    })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Contraseña del usuario. Debe tener al menos una letra mayúscula, una minúscula y un número',
        example: 'Password123',
        minLength: 6,
        maxLength: 50
    })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña debe tener una letra mayúscula, una minúscula y un número'
    })
    password: string;

    @ApiProperty({
        description: 'Nombre completo del usuario',
        example: 'Juan Pérez García',
        minLength: 1
    })
    @IsString()
    @MinLength(1)
    fullName: string;
}