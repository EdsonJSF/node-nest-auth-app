import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import {
  CreateUserDto,
  LoginUserDto,
  RegisterUserDto,
  UpdateAuthDto,
} from './dto';
import { User } from './entities/user.entity';
import { JwtPayload, LoginResponse } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, email, ...userData } = createUserDto;

    try {
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        email: email.toLowerCase(),
        ...userData,
      });

      await newUser.save();

      const { password: _, ...user } = newUser.toJSON();

      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`${email.toLowerCase()} already exists!`);
      }
      throw new InternalServerErrorException('Something terrible happen!!!');
    }
  }

  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse> {
    const { email, name, password } = registerUserDto;
    const user = await this.create({ email, name, password });

    return {
      user,
      token: this.getJwt({ id: user._id }),
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const { email, password } = loginUserDto;

    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user || !bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Not valid credentials');
    }

    const { password: _, ...rest } = user.toJSON();

    return { user: rest, token: this.getJwt({ id: user.id }) };
  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById(id: number | string): Promise<User> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(`user "${id}" does not exists!`);
    }

    const { password: _, ...rest } = user.toJSON();

    return rest;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwt(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
