## 创建Nestjs项目

使用 [Nest CLI](https://www.itying.com/6/cli?id=overview) 建立新项目非常简单。 只要确保你已经安装了 npm，然后在你的 OS 终端中使用以下命令：

 

#### npm

```
$ npm i -g @nestjs/cli
$ nest new project-name
```

#### yarn

```
$ yarn global add @nestjs/cli
$ nest new project-name
```

将创建project目录， 安装node模块和一些其他样板文件，并将创建一个src目录，目录中包含几个核心文件。

```
src
├── app.controller.ts
├── app.module.ts
└── main.ts
```

以下是这些核心文件的简要概述：

|                   |                                                             |
| :---------------- | :---------------------------------------------------------: |
| app.controller.ts |               带有单个路由的基本控制器示例。                |
| app.module.ts     |                     应用程序的根模块。                      |
| main.ts           | 应用程序入口文件。它使用NestFactory用来创建 Nest 应用实例。 |

 

main.ts包含一个异步函数，它负责**引导**我们的应用程序：

```
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);
}
bootstrap();
```

## Nestjs平台

Nest 旨在成为一个与平台无关的框架。 通过平台，可以创建可重用的逻辑部件，开发人员可以利用这些部件来跨越多种不同类型的应用程序。 从技术上讲，Nest 可以在创建适配器后使用任何 Node HTTP 框架。 有两个支持开箱即用的 HTTP 平台：express 和 fastify。 您可以选择最适合您需求的产品。

|                  |                                                              |
| :--------------- | :----------------------------------------------------------- |
| platform-express | Express 是一个众所周知的 node.js 简约 Web 框架。 这是一个经过实战考验，适用于生产的库，拥有大量社区资源。 默认情况下使用@nestjs/platform-express包。 许多用户都可以使用 Express ，并且无需采取任何操作即可启用它。 |
| platform-fastify | Fastify 是一个高性能，低开销的框架，专注于提供最高的效率和速度。 在[这里](https://www.itying.com/nestjs/6/techniques?id=性能（fastify）)阅读如何使用它。 |

无论使用哪种平台，它都会暴露自己的应用程序界面。 它们分别被视为 NestExpressApplication 和 NestFastifyApplication。

将类型传递给 NestFactory.create() 方法时，如下例所示，app 对象将具有专用于该特定平台的方法。 但是，请注意，除非您确实要访问底层平台API，否则无需指定类型。

```
const app = await NestFactory.create<NestExpressApplication>(ApplicationModule);
```

 

## 运行Nestjs应用程序

安装过程完成后，您可以在系统命令提示符下运行以下命令，以启动应用程序监听入站 HTTP 请求：

```
$ npm run start
```

此命令在src目录中的main.ts文件中定义的端口上启动 HTTP 服务器。在应用程序运行时, 打开浏览器并访问http://localhost:3000/。 你应该看到Hello world!信息。

