# Nestjs控制器

**NestJs仿小米商城项目实战视频教程(视频+课件+源码)**： https://www.itying.com/goods-1139.html



# Nestjs控制器

控制器负责处理传入的 **请求** 和向客户端返回 **响应** 。

![img](https://docs.nestjs.com/assets/Controllers_1.png)

控制器的目的是接收应用的特定请求。**路由**机制控制哪个控制器接收哪些请求。通常，每个控制器有多个路由，不同的路由可以执行不同的操作。

为了创建一个基本的控制器，我们必须使用装饰器。装饰器将类与所需的元数据关联，并使Nest能够创建路由映射（将请求绑定到相应的控制器）。

## Nestjs路由

在下面的例子中，我们使用了定义基本控制器所需的@Controller('cats')装饰器。我们将可选前缀设置为cats。使用前缀可以避免在所有路由共享通用前缀时出现冲突的情况。我们将使用@Controller()装饰器，这是定义基本控制器所必需的。我们将指定一个路径前缀(可选)cats。在@Controller()装饰器中使用路径前缀，它允许我们轻松对一组相关路由进行分组，并减少重复代码。例如，我们可以选择管理该路由下的客户实体的交互的这部分进行分组/customers，这样, 我们可以在@Controller()装饰器中指定路径前缀, 这样我们就不必为文件中的每个路由重新定义前缀。

> cats.controller.ts

```
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
```

?> 要使用 CLI 创建控制器，只需执行$ nest g controller cats命令。

findAll()方法之前的@Get()HTTP请求方法装饰器告诉Nest为HTTP请求的特定端点创建处理程序。端点对应于HTTP请求方法（在本例中为 GET）和路由。什么是路由 ？ 处理程序的路由是通过连接为控制器声明的（可选）前缀和请求装饰器中指定的任何路由来确定的。由于我们已经为每个route（cats） 声明了一个前缀，并且没有在装饰器中添加任何路由信息，因此 Nest会将GET /cats请求映射到此处理程序。如上所述，该路由包括可选的控制器路由前缀和请求方法装饰器中声明的任何路由。例如，customers与装饰器组合的路由前缀@Get('profile')会为请求生成路由映射GET /customers/profile。

在上面的示例中，当对此端点发出GET请求时，Nest会将请求路由到我们的用户定义findAll()方法。请注意，我们在此处选择的函数名称完全是任意的。我们显然必须声明一个绑定路由的函数，但Nest不会对所选的函数名称附加任何意义。

此函数将返回200状态代码和相关的响应，在这种情况下只返回了一个字符串。为什么会这样？ 我们将首先介绍Nest使用两种不同的操作响应选项的概念：

|              |                                                              |
| :----------- | :----------------------------------------------------------: |
| 标准（推荐） | 使用这个内置方法，当请求处理程序返回一个JavaScript对象或数组时，它将自动序列化为JSON。但是，当它返回一个JavaScript基本类型(例如string、number、boolean)时，Nest将只发送值，而不尝试序列化它。这使响应处理变得简单：只需要返回值，其余的由Nest负责。 |
|              | 此外，响应的状态码默认情况下始终为200，但使用201的POST请求除外。我们可以通过在处理程序级别添加@HttpCode(...)装饰器来轻松更改此行为 （[状态代码](https://www.itying.com/6/controllers?id=状态码)） |
| 类库特有的   | 我们可以在函数签名通过@Res()注入类库特定的 响应对象（例如，Express），使用此函数，您具有使用该对象的响应处理函数。例如，使用Express，您可以使用类似代码构建响应response.status(200).send() |

!> 注意！ 禁止同时使用这两种方法。Nest检测处理程序是否正在使用@Res()或@Next()，如果两个方法都用了的话, 那么在这里的标准方式就是自动禁用此路由, 你将不会得到你想要的结果。

## Nestjs Request

许多端点需要访问客户端的**请求**细节。实际上，Nest正使用类库特有(默认是express)的[请求对象](http://expressjs.com/en/api.html#req)。因此，我们可以强制Nest使用@Req()装饰器将请求对象注入处理程序。

> cats.controller.ts

```
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'This action returns all cats';
  }
}
```

?> 为了在express中使用Typescript（如request: Request上面的参数示例所示），请安装@types/express。

Request对象表示HTTP请求，并具有Request查询字符串，参数，HTTP标头 和 正文的属性（在[这里](http://www.expressjs.com.cn/4x/api.html##req)阅读更多），但在大多数情况下, 不必手动获取它们。 我们可以使用**专用**的装饰器，比如开箱即用的@Body()或@Query()。 下面是装饰器和 普通表达对象的比较。

|                         |                               |
| :---------------------- | :---------------------------- |
| @Request()              | req                           |
| @Response()             | res                           |
| @Next()                 | next                          |
| @Session()              | req.session                   |
| @Param(key?: string)    | req.params/req.params[key]    |
| @Body(key?: string)     | req.body/req.body[key]        |
| @Query(key?: string)    | req.query/req.query[key]      |
| @Headers(name?: string) | req.headers/req.headers[name] |

为了与底层HTTP平台(如Express和Fastify)之间的类型兼容，Nest提供了@Res()和@Response()装饰器。@Res()只是@Response()的别名。两者都直接公开底层响应对象接口。在使用它们时，您还应该导入底层库的类型(例如：@types/express)以充分利用它们。注意，在方法处理程序中注入@Res()或@Response()时，将Nest置于该处理程序的特定于库的模式中，并负责管理响应。这样做时，必须通过调用响应对象(例如，res.json(…)或res.send(…))发出某种响应，否则HTTP服务器将挂起。

?> 想要了解如何创建自定义的装饰器，阅读[这一章](https://www.itying.com/6/customdecorators)。

## Nestjs 资源

我们已经创建了一个端点来获取数据（**GET** 路由）。 我们通常还希望提供一个创建新记录的端点。为此，让我们创建 **POST** 处理程序:

> cats.controller.ts

```
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
```

就这么简单。Nest以相同的方式提供其余的端点装饰器-@Put()、@Delete()、@Patch()、@Options()、@Head()和@All()。这些表示各自的HTTP请求方法。

## Nestjs 路由通配符

路由同样支持模式匹配。例如，星号被用作通配符，将匹配任何字符组合。

```
@Get('ab*cd')
findAll() {
  return 'This route uses a wildcard';
}
```

以上路由地址将匹配abcd、ab_cd、abecd等。字符?、+、*以及()是它们的正则表达式对应项的子集。连字符 (-) 和点 (.) 按字符串路径解析。

## Nestjs 状态码

如前面所说，默认情况下，响应的**状态码**总是**200**，除了 POST 请求外，此时它是**201**，我们可以通过在处理程序层添加@HttpCode（...）装饰器来轻松更改此行为。

```
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
```

?>HttpCode需要从@nestjs/common包导入。

通常，状态码不是固定的，而是取决于各种因素。在这种情况下，您可以使用类库特有的的**响应**（通过@Res()注入 ）对象（或者，在出现错误时，抛出异常）。

## Nestjs Headers

要指定自定义响应头，可以使用@header()修饰器或类库特有的响应对象,（使用 并res.header()直接调用）。

```
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'This action adds a new cat';
}
```

?>Header需要从@nestjs/common包导入。

## Nestjs 重定向

要将响应重定向到特定的URL，可以使用@Redirect()装饰器或特定于库的响应对象(并直接调用res.redirect())。

@Redirect()带有必需的url参数和可选的statusCode参数。 如果省略，则statusCode默认为302。

```
@Get()
@Redirect('https://nestjs.com', 301)
```

有时您可能想动态确定HTTP状态代码或重定向URL。通过从路由处理程序方法返回一个形状为以下形式的对象：

```
{
  "url": string,
  "statusCode": number
}
```

返回的值将覆盖传递给@Redirect()装饰器的所有参数。 例如：

```
@Get('docs')
@Redirect('https://docs.nestjs.com', 302)
getDocs(@Query('version') version) {
  if (version && version === '5') {
    return { url: 'https://docs.nestjs.com/v5/' };
  }
}
```

## Nestjs 路由参数

当您需要接受**动态数据**作为请求的一部分时（例如，使用GET/cats/1来获取id为1的cat），带有静态路径的路由将无法工作。为了定义带参数的路由，我们可以在路由中添加路由参数**标记**，以捕获请求URL中该位置的动态值。@Get()下面的装饰器示例中的路由参数标记演示了此用法。可以使用@Param()装饰器访问以这种方式声明的路由参数，该装饰器应添加到函数签名中。

```
@Get(':id')
findOne(@Param() params): string {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
```

@Param()用于修饰方法参数（上面示例中的参数），并使路由参数可用作该修饰的方法参数在方法体内的属性。 如上面的代码所示，我们可以通过引用params.id来访问id参数。 您还可以将特定的参数标记传递给装饰器，然后在方法主体中按名称直接引用路由参数。

?>Param需要从@nestjs/common包导入。

```
@Get(':id')
findOne(@Param('id') id): string {
  return `This action returns a #${id} cat`;
}
```

## 范围

对于来自不同编程语言背景的人来说，了解在Nest中几乎所有内容都可以在传入的请求之间共享，这让人意外。比如我们有一个数据库连接池，具有全局状态的单例服务等。请记住，Node.js不遵循请求/响应多线程无状态模型，每个请求都由主线程处理。因此，使用单例实例对我们的应用程序来说是完全安全的。

但是，存在基于请求的控制器生命周期可能是期望行为的边缘情况，例如GraphQL应用程序中的请求缓存，比如请求跟踪或多租户。在[这里](https://www.itying.com/6/fundamentals/id=注入范围)学习如何控制范围。

## Async / await

我们喜欢现代JavaScript，而且我们知道数据读取大多是**异步**的。 这就是为什么Nest支持async并且与他们一起工作得非常好。

?> 了解更多关于Async / await请点击[这里](https://kamilmysliwiec.com/typescript-2-1-introduction-async-await)

每个异步函数都必须返回Promise。这意味着您可以返回延迟值, 而Nest将自行解析它。让我们看看下面的例子:

> cats.controller.ts

```
@Get()
async findAll(): Promise<any[]> {
  return [];
}
```

这是完全有效的。此外,通过返回RxJS[observable 流](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html)。Nest路由处理程序更强大。Nest将自动订阅下面的源并获取最后发出的值（在流完成后）。

> cats.controller.ts

```
@Get()
findAll(): Observable<any[]> {
  return of([]);
}
```

上面的方法都可以, 你可以选择你喜欢的方式。

## 请求负载

之前的POST路由处理程序不接受任何客户端参数。我们在这里添加@Body()参数来解决这个问题。

首先(如果您使用TypeScript)，我们需要确定DTO(数据传输对象)模式。DTO是一个对象，它定义了如何通过网络发送数据。我们可以通过使用TypeScript接口或简单的类来完成。令人惊讶的是，我们在这里推荐使用类。为什么?类是JavaScriptES6标准的一部分，因此它们在编译后的JavaScript中保留为实际实体。另一方面，由于TypeScript接口在转换过程中被删除，所以Nest不能在运行时引用它们。这一点很重要，因为诸如**管道**之类的特性在运行时能够访问变量的元类型时提供更多的可能性。

我们来创建CreateCatDto类：

> create-cat.dto.ts

```
export class CreateCatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

它只有三个基本属性。 之后，我们可以在CatsController中使用新创建的DTO：

> cats.controller.ts

```
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'This action adds a new cat';
}
```

## 处理错误

这里有一章关于[处理错误](https://www.itying.com/6/exceptionfilters)（即处理异常）的单独章节。

## 完整示例

下面是一个示例，该示例利用几个可用的装饰器来创建基本控制器。 该控制器公开了几种访问和操作内部数据的方法。

> cats.controller.ts

```
import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, ListAllEntities } from './dto';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} cat`;
  }
}
```

## 最后一步

控制器已经准备就绪，可以使用，**但是Nest不知道CatsController是否存在，所以它不会创建这个类的一个实例。**

**控制器总是属于模块，这就是为什么我们将controllers数组保存在@module()装饰器中。** 由于除了根ApplicationModule，我们没有其他模块，所以我们将使用它来介绍CatsController：

> app.module.ts

```
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class AppModule {}
```

我们使用@Module()装饰器将元数据附加到模块类，Nest现在可以轻松反映必须安装的控制器。

## 类库特有方式

到目前为止，我们已经讨论了Nest操作响应的标准方式。操作响应的第二种方法是使用类库特有的[响应对象(Response)](http://expressjs.com/en/api.html#res)。为了注入特定的响应对象，我们需要使用@Res()装饰器。为了对比差异，我们重写CatsController：

```
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

虽然这种方法有效，并且事实上通过提供响应对象的完全控制（标准操作，库特定的功能等）在某些方面允许更多的灵活性，但应谨慎使用。这种方式非常不清晰，并且有一些缺点。 主要是失去了与依赖于Nest标准响应处理的Nest功能的兼容性，例如拦截器和@HttpCode()装饰器。此外，您的代码可能变得依赖于平台（因为底层库可能在响应对象上有不同的API），并且更难测试（您必须模拟响应对象等）。

因此，在可能的情况下，应始终首选Nest标准方法。