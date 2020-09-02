#### 类验证器

处理接口数据，保证前后端数据的统一

![image-20200619102114987](/Users/huanyuexie/Library/Application Support/typora-user-images/image-20200619102114987.png)



dto	=>	验证层



#### **Nest.js 中的类验证器**



我们想使用 创建用户 这个功能来说明类验证器，首先来完善我们的 user 接口：



```tsx
src/users/interfaces/user.interface.ts

import { User } from './user.interface';

export interface IUserService {

   findAll(): Promise<User[]>;

   findOne(id: number): Promise<User>;

   create(User): Promise<User>;

   edit(User): Promise<User>;

   remove(id: number): Promise<boolean>;

}
```

然后改写一下我们的 UsersService，让它含有一个静态的 User 数组，并且 fineOne 和 fineAll 都从这个静态变量中获取数据，create、edit、remove也都有相应的实现：



```tsx
src/users/services/user.service.ts

import { Injectable } from '@nestjs/common';
import { User } from '../interfaces/user.interface';
import { IUserService } from '../interfaces/user-service.interface';

@Injectable()
export class UsersService implements IUserService {

    private static users: User[] = [
        { id: 1, name: '小明', age: 18 },
        { id: 2, name: '小红', age: 16 },
        { id: 3, name: '小壮', age: 20 },
    ];

    async findAll(): Promise<User[]> {
        return UsersService.users;
    }

    async findOne(id: number): Promise<User> {
        return UsersService.users.find(user => user.id == id)
    }

    async create(user: User): Promise<User> {
        UsersService.users.push(user);
        return user;
    }

    async edit(user: User): Promise<User> {
        let index = UsersService.users.findIndex(item => item.id == user.id)

        if(index >= 0) {
            UsersService.users[index] = user;
        }

        return UsersService.users[index];
    }

    async remove(id: number): Promise<boolean> {
        let index = UsersService.users.findIndex(item => item.id == id)

        if(index >= 0) {
            UsersService.users.splice(index, 1);
        }
        
        return index >= 0;
    }
}
```

现在访问 http://127.0.0.1:3000/users/3，看到下面的输出：



```json
{"id":3,"name":"小壮","age":20}
```

发送一个 post 请求后，users 数组中也确实新增了一项：



![img](https://upload-images.jianshu.io/upload_images/9566895-44b95897dc7a9318.png?imageMogr2/auto-orient/strip|imageView2/2/w/656/format/webp)

image.png

访问 http://127.0.0.1:3000/users：



```json
[
    {"id":1,"name":"小明","age":18},
    {"id":2,"name":"小红","age":16},
    {"id":3,"name":"小壮","age":20},
    {"id":"4","name":"小李","age":"17"}
]
```

我们没有得到预期的效果，心细的同学可能已经发现了， 新增加的用户的 id 和 age 值的类型是 string 而不是 number，这样的程序是很不健壮的，我们已经知道该如何使用管道来验证客户端提交的参数了，那么如何保证参数有且仅有一个 User 类型呢？
在 Nest 中 ***类验证器\*** 可以很好的解决这个问题，在使用类验证器之前，我们需要先安装两个npm包：



```ruby
$ npm install --save class-validator class-transformer
```

有关这两个包的更多用法可以到 GitHub 上搜索。
为我们的 ApiErrorCode 定义更多的业务状态码：



```cpp
export enum ApiErrorCode {
    TIMEOUT = -1, // 系统繁忙
    SUCCESS = 0, // 成功

    USER_ID_INVALID = 10001, // 用户 ID 无效
    USER_NAME_INVALID = 10002, // 用户 姓名 无效
    USER_AGE_INVALID = 10003, // 用户 年龄 无效
}
```

我们还需要一个叫做 DTO（数据传输对象）的文件，他就是一个普通的类，用来替换 UsersController 中 create 方法的参数类型，目前我们 create 方法使用的是 User 接口类型，TypeScript 接口在编译过程中被删除，这样会导致我们无法在管道中获取参数的元数据。



```kotlin
src/users/dtos/create-user.dto.ts

import { User } from "../interfaces/user.interface";
import { IsString, IsInt, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiErrorCode } from "common/enums/api-error-code.enum";

export class CreateUserDto implements User {
        
    @IsInt({ message: '用户ID必须是整数', context: { errorCode: ApiErrorCode.USER_ID_INVALID } })
    @Min(1, { message: '用户ID必须大于等于1', context: { errorCode: ApiErrorCode.USER_ID_INVALID } })
    readonly id: number;

    @IsNotEmpty({ message: '用户姓名是必不可少的', context: { errorCode: ApiErrorCode.USER_NAME_INVALID } })
    @IsString({ message: '用户姓名是必不可少的', context: { errorCode: ApiErrorCode.USER_NAME_INVALID } })
    readonly name: string;
    
    @IsInt({ message: '用户年龄必须是整数', context: { errorCode: ApiErrorCode.USER_AGE_INVALID } })
    @Min(1, { message: '用户年龄必须大于1', context: { errorCode: ApiErrorCode.USER_AGE_INVALID } })
    @Max(200, { message: '用户年龄必须小于200', context: { errorCode: ApiErrorCode.USER_AGE_INVALID } })
    readonly age: number;
}
```

在 UsersController 中使用我们的 DTO 对象：



```tsx
src/users/users.controller.ts

import { Controller, Param, Get, Post, Delete, Put, Body } from '@nestjs/common';
import { User } from './interfaces/user.interface';
import { UsersService } from './services/users.service';
import { UserIdPipe } from './pipes/user-id.pipe';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(): Promise<User[]> {

        return await this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', new UserIdPipe()) id): Promise<User> {

        return await this.usersService.findOne(id);
    }

    @Post()
    async create(@Body() user: CreateUserDto): Promise<User> {

        return await this.usersService.create(user);
    }

    @Put()
    async edit(@Body() user: CreateUserDto): Promise<User> {

        return await this.usersService.edit(user);
    }

    @Delete(':id')
    async remove(@Param('id', new UserIdPipe()) id): Promise<boolean> {

        return await this.usersService.remove(id);
    }
}
```

现在我们的控制器看起来非常简洁，它只做了它该做的事情——分发请求， 业务逻辑的实现交给 service 层， 参数的验证交给 验证层。
让我们来实现我们的类验证器，我们打算写一个全局的DTO验证层， 如果你没有忘记 ***面向切面编程\*** 那么你应该知道DTO验证层在我们系统的各个模块中也是一个横切面：



```tsx
src/common/pipes/api-params-validation.pipe.ts

import { ArgumentMetadata, PipeTransform, Injectable, HttpStatus } from '@nestjs/common';
import { ApiException } from '../exceptions/api.exception';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ApiParamsValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {

    const { metatype } = metadata;

    // 如果参数不是 类 而是普通的 JavaScript 对象则不进行验证
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    
    // 通过元数据和对象实例，去构建原有类型
    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      // 获取到第一个没有通过验证的错误对象
      let error = errors.shift();
      let constraints = error.constraints
      let contexts = error.contexts
      
      // 将未通过验证的字段的错误信息和状态码，以ApiException的形式抛给我们的全局异常过滤器
      for (let key in constraints) {
        throw new ApiException(constraints[key], contexts[key].errorCode, HttpStatus.BAD_REQUEST);
      }

    }

    return value;
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find((type) => metatype === type);
  }
}
```

值得注意的一点是，要想让 TypeScript 将客户提交上来的数据转换成正确的类型，我们需要手动指定类型元数据：



```tsx
src/users/dtos/create-user.dto.ts

import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ApiErrorCode } from "common/enums/api-error-code.enum";
import { User } from "../interfaces/user.interface";

export class CreateUserDto implements User {
        
    @Type(() => Number)    
    @Min(1, { message: '用户ID必须大于等于1', context: { errorCode: ApiErrorCode.USER_ID_INVALID } })
    @IsInt({ message: '用户ID必须是整数', context: { errorCode: ApiErrorCode.USER_ID_INVALID } })
    readonly id: number;

    @IsString({ message: '用户姓名必须是字符串', context: { errorCode: ApiErrorCode.USER_NAME_INVALID } })
    @IsNotEmpty({ message: '用户姓名是必不可少的', context: { errorCode: ApiErrorCode.USER_NAME_INVALID } })
    readonly name: string;
        
    @Type(() => Number)    
    @Min(1, { message: '用户年龄必须大于1', context: { errorCode: ApiErrorCode.USER_AGE_INVALID } })
    @Max(200, { message: '用户年龄必须小于200', context: { errorCode: ApiErrorCode.USER_AGE_INVALID } })
    @IsInt({ message: '用户年龄必须是整数', context: { errorCode: ApiErrorCode.USER_AGE_INVALID } })
    readonly age: number;
}
```

最后一步，在 main.ts 中使用我们的全局类验证器：



```jsx
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from 'app.module';
import { HttpExceptionFilter } from 'common/filters/http-exception.filter';
import { ApiParamsValidationPipe } from 'common/pipes/api-params-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ApiParamsValidationPipe());

  await app.listen(3000);
}
bootstrap();
```

现在我们对客户端输入的参数做了非常严格的校验