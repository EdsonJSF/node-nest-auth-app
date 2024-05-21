import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './';

export class UpdateAuthDto extends PartialType(CreateUserDto) {}
