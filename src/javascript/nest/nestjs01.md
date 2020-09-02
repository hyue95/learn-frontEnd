NestJs 学习(一) 基础知识


Nest.js框架，它有效地解决了Nodejs项目中的一个难题：体系结构。
Nest旨在提供开箱即用的应用程序，可以轻松创建高度可测试，可扩展，松散耦合且易于维护的应用程序。
Nest.js将TypeScript引入Node.js中并基于Express封装

什么是Nest
Nest是一个强大的Node web框架。
它可以帮助您轻松地构建高效、可伸缩的应用程序。
它使用现代JavaScript，用TypeScript构建，
结合OOP 和 FP。
受到 Java Spring & Angular的设计理念 影响

核心概念
架构概述

AppModule

每个Nest应用都有一个根模块，通常是 AppModule。根模块提供了用来启动应用的引导机制，可以包含很多功能模块。
@Module({imports: [xxx,ccc,aaa]}) //导入功能模块

**Module 模块（为路由controller提供相应的服务service）**
Module装饰器接受一个对象，

```
@Global()	=>	变全局
```

属性	描述
**providers	由nest注入器实例化的服务，可以在这个模块之间共享**
**controller	存放创建的一组控制器**
**imports	导入此模块中所需的提供程序的模块列表**
**exports	导出这个模块可以其他模块享用providers里的服务**
实际是可以进行 共享

怎么组织一个模块结构图

AppModule 根模块



CoreModule 核心模块（注册中间件，过滤器，管道，守卫，拦截器，装饰器等）
SharedModule 共享模块（注册服务，mongodb，redis等）
ConfigModule 配置模块（系统配置）
FeatureModule 特性模块（业务模块，如用户模块，产品模块等）
在Nest中，模块默认是单例的，因此可以在多个模块之间共享任何提供者的同一个实例。共享模块毫不费力。

Controlller 控制器
通俗来说就是路由Router，负责处理客户端传入的请求参数并向客户端返回响应数据，也可以理解是HTTP请求。

它们将类与基本的元数据相关联，因此Nest知道如何将控制器映射到相应的路由。

@Controller它是定义基本控制器所必需的。@Controller(‘Router Prefix’)是类中注册的每个路由的可选前缀。使用前缀可以避免在所有路由共享一个公共前缀时重复使用自己。
@Controller 来自 @nest/common

端点 =》 HTTP请求
1
@Controller相关装饰器

方法参数装饰器
装饰器名称	描述
	@Request()/@req	请求体
	@Response()/@res	响应体
	@Next()	–
	@Session()	req.session
	@Param(param?: string)	req.param
	@Body(param?: string)	req.body
	@Query(param?: string)	req.query
	@Headers(param?: string)	req.headers
方法装饰器 HTTP请求方式
装饰器名称	描述
	@Post()	Post
	@Get()	Get
	@Put()	Put
	@Delete()	Delete
	@All()	All
	@Patch()	Patch
	@Options()	Options
	@Head()	Head
	@Render()	res.render
	@Header()	res,header
	@HttpCode()	res.status
import { Controller, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request) {
    return 'This action returns all cats';
  }

findAll() 方法前的 @Get() 修饰符告诉 Nest 创建此路由路径的端点，并将每个相应的请求映射到此处理程序。由于我们为每个路由（cats）声明了前缀，所以 Nest 会在这里映射每个 /cats 的 GET 请求

Provider & Dependency injection 服务与依赖注入
Provider 服务 包含应用所需的任何值、函数或特性/定义了用途 的 类

Nest 将 控制器 和 服务 区分开
服务(提供者) --- 控制器(消费者)
如何联系到一起   ---- DI 依赖注入 将服务注入到控制器中，让控制器类得以访问该该服务类

需要使用 @Injectable装饰器提供元数据，可以将一个类定义成服务

**server通过 @Injectable ，与dao层连接，与数据库建立联系**



在某个模块中，应该有这样的架构

xxx
xxx.module.js 需要导出的模块
xxx.controller.js 控制器，即消费者
xxx.service.js 服务，即提供者

**在 xxx.service.js 中需要使用 @Injectable 提供元数据**

**在 xxx.controller.js 中需要 引入 service 使用**

**在 xxx.module.js 中 这样写**

@Module({
    controllers: [xxxController],
    providers: [xxxService],
    exports: [xxxService]
})

Middleware 中间件
中间件是在路由处理程序之前调用的函数。中间件功能可以访问请求和响应对象，以及应用程序请求-响应周期中的下一个中间件功能。下一个中间件函数通常由一个名为next的变量表示。

执行任何代码。
对请求和响应对象进行更改。
请求-响应周期结束。
调用堆栈中的下一个中间件函数。
如果当前中间件函数没有结束请求-响应周期，它必须调用next()将控制权传递给下一个中间件函数。否则，请求将被挂起。
实现

函数
带有 @Injectable() 装饰器的类 ，需要实现 NestMiddleware 接口
// 实现一个带有`@Injectable()`装饰器的类打印中间件
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  resolve(...args: any[]): MiddlewareFunction {
    return (req, res, next) => {
      console.log('Request...');
      next();
    };
  }
}

使用

全局注册
async function bootstrap() {
  // 创建Nest.js实例
  const app = await NestFactory.create(AppModule, application, {
    bodyParser: true,
  });
  // 注册中间件
  app.use(LoggerMiddleware());
  // 监听3000端口
  await app.listen(3000);
}
bootstrap();

在模块局部注册
他们注册地方不一样，影响的路由也不一样，全局注册影响全部路由，局部注册只是影响当前路由下的路由。

Exception filter 过滤器
异常处理

基本异常处理类 HttpException from ‘@nestjs/common’

new HttpException({message:'aaa', statusCode: 404}, HttpStatus.FORBIDDEN)

HttpException 接受2个参数：

消息内容，可以是字符串错误消息或者对象{status: 状态码，error：错误消息}
状态码
快捷过滤器
Nest给我们提供很多这样快捷常用的HTTP状态错误：

BadRequestException 400
UnauthorizedException 401
ForbiddenException 403
NotFoundException 404
NotAcceptableException 406
RequestTimeoutException 408
ConflictException 409
GoneException 410
PayloadTooLargeException 413
UnsupportedMediaTypeException 415
UnprocessableEntityException 422
InternalServerErrorException 500
NotImplementedException 501
BadGatewayException 502
ServiceUnavailableException 503
GatewayTimeoutException 504
自定义过滤器

Pipe 管道
@Injectable()类，实现PipeTransform接口

作用：
将输入数据转换为所需的输出，处理验证

管道可以把你的请求参数根据特定条件验证类型、对象结构或映射数据。管道是一个纯函数，不应该从数据库中选择或调用任何服务操作

Nest为我们内置了2个通用的管道，from ‘@nestjs/common’

数据验证ValidationPipe，配合使用 class-validator class-transformer
数据转换ParseIntPipe
使用方式：

直接@Body()装饰器里面使用，只作用当前body这个参数
在@UsePipes()装饰器里面使用，作用当前这条路由所有的请求参数
在@UsePipes()装饰器里面使用，作用当前控制器路由所有的请求参数
在全局注册使用内置实例方法useGlobalPipes，作用整个项目。这个管道比较通用推荐全局注册。
ParseIntPipe使用也很简单，就是把一个字符串转换成数字。也是比较常用的，特别是你的id是字符串数字的时候，用get，put，patch，delete等请求，有id时候特别好用了。
还可以做分页处理，

Guard 守卫
守卫可以做权限认证，如果你没有权限可以拒绝你访问这个路由，默认返回403错误

守卫是用@Injectable()装饰器注释的类。应该实现CanActivate接口，具体代码在canActivate方法实现，返回一个布尔值，true就表示有权限，false抛出异常403错误。这个写法和Angular很像。

使用：

直接@UseGuards()装饰器里面使用，作用当前控制器路由所有的请求参数 *
在全局注册使用内置实例方法useGlobalGuards，作用整个项目。
Interceptor 拦截器
拦截器可以做很多功能，比如缓存处理，响应数据转换，异常捕获转换，响应超时跑错，打印请求响应日志。

拦截器是用@Injectable()装饰器注释的类。应该实现NestInterceptor接口，具体代码在intercept方法实现，返回一个Observable，这个写法和Angular很像。
src/common/interceptor/timeout.ts

拦截器可以做什么：

在方法执行之前/之后绑定额外的逻辑
转换从函数返回的结果
转换从函数抛出的异常
扩展基本的函数行为
完全覆盖一个函数取决于所选择的条件(例如缓存)
使用方法

直接@UseInterceptors()装饰器里面使用，作用当前路由，还可以传参数，需要特殊处理，写成高阶函数，也可以使用依赖注入。*
直接@UseInterceptors()装饰器里面使用，作用当前控制器路由，这个不能传参数，可以使用依赖注入
在全局注册使用内置实例方法useGlobalInterceptors，作用整个项目。
总结 & 开发
总结
模块是按业务逻辑划分基本单元，包含控制器和服务。控制器是处理请求和响应数据的部件，服务处理实际业务逻辑的部件。

**中间件是路由处理Handler前的数据处理层，只能在模块或者全局注册，可以做日志处理中间件、用户认证中间件等处理，中间件和express的中间件一样，所以可以访问<u>整个request、response</u>的上下文，模块作用域可以依赖注入服务。全局注册只能是一个纯函数或者一个高阶函数。（最先执行**	日志处理）**



**守卫是决定请求是否可以到达对应的路由处理器，能够知道当前路由的执行上下文，可以控制器中的类、方法、全局注册使用，可以做角色守卫。**（**implements CanActivate ）哪些路由可以访问**



**管道是数据流处理，在中间件后路由处理前做数据处理，可以控制器中的类、方法、方法参数、全局注册使用，只能是一个纯函数。可以做数据验证，数据转换等数据处理。implements PipeTransform**



功能最全

**拦截器是进入控制器之前和之后处理相关逻辑，能够知道当前路由的执行上下文，可以控制器中的类、方法、全局注册使用，可以做日志、事务处理、异常处理、响应数据格式等。 implements NestInterceptor**



**过滤器是捕获错误信息，返回响应给客户端。可以控制器中的类、方法、全局注册使用，可以做自定义响应异常格式。**



中间件、过滤器、管道、守卫、拦截器，这是几个比较容易混淆的东西。他们有个共同点都是和控制器挂钩的中间抽象处理层，但是他们的职责却不一样。

全局管道、守卫、过滤器和拦截器和任何模块松散耦合。他们不能依赖注入任何服务，因为他们不属于任何模块。
可以使用控制器作用域、方法作用域或辅助作用域仅由管道支持，其他除了中间件是模块作用域，都是控制器作用域和方法作用域。

重点：在示例给出了它们的写法，注意全局管道、守卫、过滤器和拦截器，只能new，全局中间件是纯函数，全局管道、守卫、过滤器和拦截器，中间件都不能依赖注入。中间件模块注册也不能用new，可以依赖注入。管道、守卫、过滤器和拦截器局部注册可以使用new和类名，除了管道以为其他都可以依赖注入。拦截器和守卫可以写成高阶方法来传参，达到定制目的。

管道、过滤器、拦截器守卫都有各自的具体职责。拦截器和守卫与模块结合在一起，而管道和过滤器则运行在模块区域之外。管道任务是根据特定条件验证类型、对象结构或映射数据。过滤器任务是捕获各种错误返回给客户端。管道不是从数据库中选择或调用任何服务的适当位置。另一方面来说，拦截器不应该验证对象模式或修饰数据。如果需要重写，则必须由数据库调用服务引起。守卫决定了哪些路由可以访问，它接管你的验证责任。

那你肯定最关心他们执行顺序是什么：

#### 客户端请求 ---> 中间件 ---> 守卫 ---> 拦截器之前 ---> 管道 ---> 控制器处理并响应 ---> 拦截器之后 ---> 过滤器

nest模块

@nestjs/common 提供很多装饰器，log服务等

@nestjs/core 核心模块处理底层框架兼容

@nestjs/microservices 微服务支持

@nestjs/testing 测试套件

@nestjs/websockets websocket支持

@nestjs/typeorm 数据库处理

@nestjs/graphql API查询语言

@nestjs/cqrs 命令查询的责任分离Command Query Responsibility Segregation (简称CQRS)模式是一种架构体系模式，能够使改变模型的状态的命令和模型状态的查询实现分离

@nestjs/passport 身份验证（v5版支持，不向下兼容）

@nestjs/swagger swagger UI API

@nestjs/mongoose mongoose模块

开发

使用 nest-cli

$ npm install -g @nestjs/cli    
$ nest new nest-demo
$ cd nest-demo

// 启动命令

npm run start // 预览
npm run start:dev // 开发
npm run prestart:prod // 编译成js
npm run start:prod // 生产
// 测试命令

npm run test // 单元测试
npm run test:cov // 单元测试+覆盖率生成
npm run test:e2e // E2E测试

原文链接：https://blog.csdn.net/zr15829039341/article/details/89386078



也可以参考： https://www.itying.com/nestjs/article-index-id-111.html