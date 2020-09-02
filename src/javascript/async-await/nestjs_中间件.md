# Nestjs 中间件_Nestjs 应用中间件 Nestjs 函数式中间件 Nestjs 全局中间件

**NestJs仿小米商城项目实战视频教程(视频+课件+源码)**： https://www.itying.com/goods-1139.html



# Nestjs 中间件

中间件是在路由处理程序 **之前** 调用的函数。 中间件函数可以访问请求和响应对象，以及应用程序请求响应周期中的next()中间件函数。next()中间件函数通常由名为next的变量表示。

![图1](https://docs.nestjs.com/assets/Middlewares_1.png)

Nest 中间件实际上等价于 [express](http://expressjs.com/en/guide/using-middleware.html) 中间件。 下面是Express官方文档中所述的中间件功能：

中间件函数可以执行以下任务:

- 执行任何代码。
- 对请求和响应对象进行更改。
- 结束请求-响应周期。
- 调用堆栈中的下一个中间件函数。
- 如果当前的中间件函数没有结束请求-响应周期, 它必须调用next()将控制传递给下一个中间件函数。否则, 请求将被挂起。

您可以在函数中或在具有@Injectable()装饰器的类中实现自定义Nest中间件。 这个类应该实现NestMiddleware接口, 而函数没有任何特殊的要求。 让我们首先使用类方法实现一个简单的中间件功能。

> logger.middleware.ts

```javascript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {	//模板
    console.log('Request...');
    next();
  }
}
```

## 依赖注入

Nest中间件完全支持依赖注入。 就像提供者和控制器一样，它们能够**注入**属于同一模块的依赖项（通过constructor）。

## Nestjs 应用中间件

中间件不能在@Module()装饰器中列出。我们必须使用模块类的configure()方法来设置它们。包含中间件的模块必须实现NestModule接口。我们将LoggerMiddleware设置在ApplicationModule层上。

> app.module.ts

```
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
```

我们还可以在配置中间件时将包含路由路径的对象和请求方法传递给forRoutes()方法。我们为之前在CatsController中定义的/cats路由处理程序设置了LoggerMiddleware。我们还可以在配置中间件时将包含路由路径的对象和请求方法传递给forRoutes()方法，从而进一步将中间件限制为特定的请求方法。在下面的示例中，请注意我们导入了RequestMethod来引用所需的请求方法类型。

> app.module.ts

```
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
```

?> 可以使用async/await来实现configure()方法的异步化(例如，可以在configure()方法体中等待异步操作的完成)。

## 路由通配符

路由同样支持模式匹配。例如，星号被用作**通配符**，将匹配任何字符组合。

```
forRoutes({ path: 'ab*cd', method: RequestMethod.ALL });
```

以上路由地址将匹配abcd、ab_cd、abecd等。字符?、+、*以及()是它们的正则表达式对应项的子集。连字符 (-) 和点 (.) 按字符串路径解析。

## 中间件消费者

MiddlewareConsumer是一个帮助类。它提供了几种内置方法来管理中间件。他们都可以被简单地**链接**起来。forRoutes()可接受一个字符串、多个字符串、对象、一个控制器类甚至多个控制器类。在大多数情况下，您可能只会传递一个由逗号分隔的控制器列表。以下是单个控制器的示例：

> app.module.ts

```
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller.ts';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
```

?> 该apply()方法可以使用单个中间件，也可以使用多个参数来指定多个**多个中间件**。

我们可能经常希望将某些路由排除在中间件应用之外。当使用类定义中间件时(正如我们到目前为止所做的，而不是使用替代[函数式中间件](https://www.itying.com/nestjs/6/middlewares?id=函数式中间件)），我们可以使用该exclude()方法轻松地排除某些路由。该方法采用一个或多个对象标识要排除的path和method，如下所示：

```
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },
    { path: 'cats', method: RequestMethod.POST }
  )
  .forRoutes(CatsController);
```

通过上面的示例，LoggerMiddleware将绑定到CatsController除了exclude()方法的两个内部定义的所有路由。请注意，该exclude()方法不适用于函数中间件（在函数中而不是在类中定义的中间件;有关更多详细信息，请参阅下文）。此外，此方法不排除来自更通用路由（例如，通配符）的路径。如果您需要这种级别的控制，您应该将路径限制逻辑直接放入中间件，例如，访问请求的URL以有条件地应用中间件逻辑。

## Nestjs 函数式中间件

我们使用的LoggerMiddleware类非常简单。它没有成员，没有额外的方法，没有依赖关系。为什么我们不能只使用一个简单的函数？这是一个很好的问题，因为事实上 - 我们可以做到。这种类型的中间件称为**函数式中间件**。让我们把logger转换成函数。

> logger.middleware.ts

```
export function logger(req, res, next) {
  console.log(`Request...`);
  next();
};
```

现在在ApplicationModule中使用它。

> app.module.ts

```
consumer
  .apply(logger)
  .forRoutes(CatsController);
```

?> 当您的中间件没有任何依赖关系时，我们可以考虑使用函数式中间件。

## Nestjs 多个中间件

如前所述，为了绑定顺序执行的多个中间件，我们可以在apply()方法内用逗号分隔它们。

```
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

## Nestjs 全局中间件

如果我们想一次性将中间件绑定到每个注册路由，我们可以使用由INestApplication实例提供的use()方法：

```
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(3000);
```