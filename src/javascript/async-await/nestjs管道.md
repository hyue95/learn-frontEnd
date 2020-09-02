# Nestjs管道

管道是具有@Injectable()装饰器的类。管道应实现PipeTransform接口。

![img](https://docs.nestjs.com/assets/Pipe_1.png)

管道有两个类型:

- **转换**：管道将输入数据转换为所需的数据输出	implement PipeTransform
- **验证**：对输入数据进行验证，如果验证成功继续传递; 验证失败则抛出异常; implement ValidationPipe

在这两种情况下, 管道参数(arguments)会由 [控制器(controllers)的路由处理程序](https://www.itying.com/nestjs/6/controllers?id=路由参数) 进行处理. Nest 会在调用这个方法之前插入一个管道，管道会先拦截方法的调用参数,进行转换或是验证处理，然后用转换好或是验证好的参数调用原方法。

?> 管道在异常区域内运行。这意味着当抛出异常时，它们由核心异常处理程序和应用于当前上下文的 [异常过滤器](https://www.itying.com/nestjs/6/exceptionfilters.md) 处理。当在 Pipe 中发生异常，controller 不会继续执行任何方法。

## 内置管道

Nest自带三个开箱即用的管道，即ValidationPipe，ParseIntPipe和ParseUUIDPipe。他们从@nestjs/common包中导出。为了更好地理解它们是如何工作的，我们将从头开始构建它们。

我们从ValidationPipe. 开始。 首先它只接受一个值并立即返回相同的值，其行为类似于一个标识函数。

> validation.pipe.ts

```
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
```

?>PipeTransform<T, R>是一个通用接口，其中T表示value的类型，R表示transform()方法的返回类型。

每个管道必须提供transform()方法。 这个方法有两个参数：

- value
- metadata

value是当前处理的参数，而metadata是其元数据。元数据对象包含一些属性：

```
export interface ArgumentMetadata {
  readonly type: 'body' | 'query' | 'param' | 'custom';
  readonly metatype?: Type<any>;
  readonly data?: string;
}
```

这里有一些属性描述参数：

| 参数     | 描述                                                         |
| :------- | :----------------------------------------------------------- |
| type     | 告诉我们该属性是一个 body@Body()，query@Query()，param@Param()还是自定义参数 [在这里阅读更多](https://www.itying.com/nestjs/customdecorators.md)。 |
| metatype | 属性的元类型，例如String。 如果在函数签名中省略类型声明，或者使用原生 JavaScript，则为undefined。 |
| data     | 传递给装饰器的字符串，例如@Body('string')。 如果您将括号留空，则为undefined。 |

!>TypeScript接口在编译期间消失，所以如果你使用接口而不是类，那么metatype的值将是一个Object。

## 测试用例

我们来关注一下CatsController的create()方法：

> cats.controler.ts

```
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

下面是CreateCatDto参数. 类型为 CreateCatDto:

> create-cat.dto.ts

```
export class CreateCatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

我们要确保create方法能正确执行，所以必须验证CreateCatDto里的三个属性。我们可以在路由处理程序方法中做到这一点，但是我们会打破单个责任原则（SRP）。另一种方法是创建一个验证器类并在那里委托任务，但是不得不每次在方法开始的时候我们都必须使用这个验证器。那么验证中间件呢？ 这可能是一个好主意，但我们不可能创建一个整个应用程序通用的中间件(因为中间件不知道execution context执行环境,也不知道要调用的函数和它的参数)。

在这种情况下，你应该考虑使用**管道**。

## 对象结构验证

有几种方法可以实现，一种常见的方式是使用**基于结构**的验证。[Joi](https://github.com/hapijs/joi) 库是允许您使用一个可读的 API 以非常简单的方式创建 schema，让我们俩试一下基于 Joi 的验证管道。

首先安装依赖：

```
$ npm install --save @hapi/joi
$ npm install --save-dev @types/hapi__joi
```

在下面的代码中，我们先创建一个简单的 class，在构造函数中传递 schema 参数. 然后我们使用schema.validate()方法验证.

就像是前面说过的，验证管道要么返回该值，要么抛出一个错误。 在下一节中，你将看到我们如何使用@UsePipes()修饰器给指定的控制器方法提供需要的 schema。

```
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: Object) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}
```

## 绑定管道

绑定管道（可以绑在 controller 或是其方法上）非常简单。我们使用@UsePipes()装饰器并创建一个管道实例，并将其传递给 Joi 验证。

```
@Post()
@UsePipes(new JoiValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

## 类验证器

!> 本节仅适用于TypeScript

让我们看一下验证的另外一种实现方式

Nest 与 [class-validator](https://github.com/pleerock/class-validator) 配合得很好。这个优秀的库允许您使用基于装饰器的验证。装饰器的功能非常强大，尤其是与 Nest 的 Pipe 功能相结合使用时，因为我们可以通过访问metatype信息做很多事情，在开始之前需要安装一些依赖。

```
$ npm i --save class-validator class-transformer
```

安装完成后，我们就可以向CreateCatDto类添加一些装饰器。

> create-cat.dto.ts

```
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  readonly name: string;

  @IsInt()
  readonly age: number;

  @IsString()
  readonly breed: string;
}
```

?> 有关 class-validator decorators [在这里阅读更多](https://github.com/typestack/class-validator#usage)

现在我们来创建一个ValidationPipe类。

> validation.pipe.ts

```
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

?>我们已经使用了 [class-transformer](https://github.com/pleerock/class-transformer) 库。它和 [class-validator](https://github.com/pleerock/class-validator) 库由同一个作者开发，所以他们配合的很好。

让我们来看看这个代码。首先你会发现transform()函数是异步的, Nest 支持**同步**和**异步**管道。这样做的原因是因为有些class-validator的验证是[可以异步的](https://www.itying.com/nestjs/typestack/class-validator#custom-validation-classes)(Promise)

接下来请注意，我们正在使用解构赋值（从ArgumentMetadata中提取参数）到方法中。这是一个先获取全部ArgumentMetadata然后用附加语句提取某个变量的简写方式。

下一步，请观察toValidate()方法。当验证类型不是 JavaScript 的数据类型时，跳过验证。

下一步，我们使用class-transformer的plainToClass()方法来转换 JavaScript 的参数为可验证的类型对象。一个请求中的 body 数据是不包行类型信息的，Class-validator需要使用前面定义过的 DTO，就需要做一个类型转换。

最后，如前所述，这就是一个验证管道，它要么返回值不变，要么抛出异常。

最后一步是设置ValidationPipe。管道，与[异常过滤器](https://www.itying.com/nestjs/exceptionfilters.md)相同，它们可以是方法范围的、控制器范围的和全局范围的。另外，管道可以是参数范围的。我们可以直接将管道实例绑定到路由参数装饰器，例如@Body()。让我们来看看下面的例子：

> cats.controler.ts

```
@Post()
async create(@Body(new ValidationPipe()) createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

当验证逻辑仅涉及一个指定的参数时，参数范围的管道非常有用。要在方法级别设置管道，您需要使用UsePipes()装饰器。

> cats.controler.ts

```
@Post()
@UsePipes(new ValidationPipe())
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

?>@UsePipes()修饰器是从@nestjs/common包中导入的。

在上面的例子中ValidationPipe的实例已就地立即创建。另一种可用的方法是直接传入类（而不是实例），让框架承担实例化责任，并启用**依赖注入**。

> cats.controler.ts

```
@Post()
@UsePipes(ValidationPipe)
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

由于ValidationPipe被创建为尽可能通用，所以我们将把它设置为一个**全局作用域**的管道，用于整个应用程序中的每个路由处理器。

> main.ts

```
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

!> 在 [混合应用](https://www.itying.com/nestjs/6/faq?id=混合应用)中useGlobalPipes()方法不会为网关和微服务设置管道, 对于标准(非混合) 微服务应用使用useGlobalPipes()全局设置管道。

全局管道用于整个应用程序、每个控制器和每个路由处理程序。就依赖注入而言，从任何模块外部注册的全局管道（如上例所示）无法注入依赖，因为它们不属于任何模块。为了解决这个问题，可以使用以下构造直接为任何模块设置管道：

> app.module.ts

```
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    }
  ]
})
export class AppModule {}
```

?> 请注意使用上述方式依赖注入时，请牢记无论你采用那种结构模块管道都是全局的，那么它应该放在哪里呢？使用ValidationPipe定义管道 另外，useClass 并不是处理自定义提供者注册的唯一方法。在[这里](https://www.itying.com/nestjs/6/fundamentals?id=custom-providers)了解更多。

## 转换管道

验证不是管道唯一的用处。在本章的开始部分，我已经提到管道也可以将输入数据**转换**为所需的输出。这是可以的，因为从transform函数返回的值完全覆盖了参数先前的值。在什么时候使用？有时从客户端传来的数据需要经过一些修改（例如字符串转化为整数），然后处理函数才能正确的处理。还有种情况，比如有些数据具有默认值，用户不必传递带默认值参数，一旦用户不穿就使用默认值。**转换管道**被插入在客户端请求和请求处理程序之间用来处理客户端请求。

> parse-int.pipe.ts

```
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

如下所示, 我们可以很简单的配置管道来处理所参数 id:

```
@Get(':id')
async findOne(@Param('id', new ParseIntPipe()) id) {
  return await this.catsService.findOne(id);
}
```

由于上述结构，ParseIntpipe将在请求触发相应的处理程序之前执行。

另一个有用的例子是按 ID 从数据库中选择一个现有的**用户实体**。

```
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}
```

如果愿意你还可以试试ParseUUIDPipe管道, 它用来分析验证字符串是否是 UUID.

```
@Get(':id')
async findOne(@Param('id', new ParseUUIDPipe()) id) {
  return await this.catsService.findOne(id);
}
```

?>ParseUUIDPipe会使用 UUID 3,4,5 版本 来解析字符串, 你也可以单独设置需要的版本.

你也可以试着做一个管道自己通过 id 找到实体数据:

```
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}
```

请读者自己实现, 这个管道接收 id 参数并返回 UserEntity 数据, 这样做就可以抽象出一个根据 id 得到 UserEntity 的公共管道, 你的程序变得更符合声明式(Declarative 更好的代码语义和封装方式), 更 DRY (Don't repeat yourself 减少重复代码) 编程规范.

## 内置验证管道

幸运的是，由于ValidationPipe和ParseIntPipe是内置管道，因此您不必自己构建这些管道（请记住，ValidationPipe需要同时安装class-validator和class-transformer包）。

内置的ValidationPipe提供了比本章描述的更多的选项，为了简单和减少学习曲线，这些选项一直保持基本。你可以在[这里](https://docs.nestjs.com/techniques/validation)查看很多例子。

另一个选项是**转换**，回想一下前面提到过的反序列化 body 数据没有验证类型（DTO 定义）。到目前为止我们已经使用管道来验证数据，你可能还记得在这个过程中，我们用class-transform把普通对象转换为 DTO 可验证对象来进行验证。内置的ValidationPipe也可以返回转换后的对象，该对象 **transform** 的值为 **true**，如下所示：

> cats.controller.ts

```
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

?>ValidationPipe是从@nestjs/common包中导入的。

因为这个管道是基于class-validator和class-transformer库的，所以有很多选项可配置。选项如下：

```
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

下面是transform属性和所有class-validator选项（从ValidatorOptions接口继承）：

| 参数                   | 类型     | 描述                                                         |
| :--------------------- | :------- | :----------------------------------------------------------- |
| skipMissingProperties  | boolean  | 如果设置为 true，则验证程序将跳过验证对象中缺少的属性的验证。 |
| whitelist              | boolean  | 如果设置为 true，则验证程序将除去未使用任何装饰器的属性的已验证对象。 |
| forbidNonWhitelisted   | boolean  | 如果设置为 true，则验证程序将引发异常，而不是取消非白名单属性。 |
| forbidUnknownValues    | boolean  | 如果设置为 true，未知对象的验证将立即失败。                  |
| disableErrorMessages   | boolean  | 如果设置为 true，验证错误将不会转发到客户端。                |
| exceptionFactory       | Function | 设置异常的工厂方法，用来定义并返回要抛出的异常信息。         |
| groups                 | string[] | 验证对象期间要使用的组。                                     |
| dismissDefaultMessages | boolean  | 如果设置为 true，验证将不使用默认消息。如果错误消息未显式设置，则为undefined的。 |
| validationError.target | boolean  | 目标是否应在ValidationError中展示                            |
| validationError.value  | boolean  | 验证值是否应在ValidationError中展示。                        |

?> 您可以在他的[库](https://github.com/typestack/class-validator)中找到关于class-validator包的更多信息。。