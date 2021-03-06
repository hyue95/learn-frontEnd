# Nestjs JWT_Nestjs 认证

**NestJs仿小米商城项目实战视频教程(视频+课件+源码)**： https://www.itying.com/goods-1139.html



## 认证（Authentication）

身份验证是大多数现有应用程序的重要组成部分。有许多不同的方法、策略和方法来处理用户授权。任何项目采用的方法取决于其特定的应用程序要求。本章介绍了几种可以适应各种不同要求的身份验证方法。

passport是目前最流行的node.js认证库，为社区所熟知，并相继应用于许多生产应用中。将此工具与Nest框架集成起来非常简单。为了演示，我们将设置 passport-http-bearer 和 passport-jwt 策略。

Passport是最流行的node.js身份验证库，为社区所熟知，并成功地应用于许多生产应用程序中。将这个库与使用@nestjs/passport模块的Nest应用程序集成起来非常简单。在较高级别，Passport执行一系列步骤以：

- 通过验证用户的"证"(例如用户名/密码、JSON Web令牌(JWT)或身份提供者的身份令牌)来验证用户的身份。
- 管理经过身份验证的状态(通过发出可移植的令牌，例如JWT，或创建一个Express会话)
- 将有关经过身份验证的用户的信息附加到请求对象，以便在路由处理程序中进一步使用

Passport具有丰富的策略生态系统，可实施各种身份验证机制。 尽管概念上很简单，但是您可以选择的Passport策略集非常多，并且有很多种类。Passport将这些不同的步骤抽象为标准模式，而@nestjs/passport模块将该模式包装并标准化为熟悉的Nest构造。

在本章中，我们将使用这些强大而灵活的模块为RESTful API服务器实现完整的端到端身份验证解决方案。您可以使用这里描述的概念来实现Passport策略，以定制您的身份验证方案。您可以按照本章中的步骤来构建这个完整的示例。您可以在[这里](https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt)找到带有完整示例应用程序的存储库。

### 身份认证

让我们充实一下我们的需求。对于此用例，客户端将首先使用用户名和密码进行身份验证。一旦通过身份验证，服务器将发出JWT，该JWT可以在后续请求的授权头中作为token发送，以验证身份验证。我们还将创建一个受保护的路由，该路由仅对包含有效JWT的请求可访问。

我们将从第一个需求开始:验证用户。然后我们将通过发行JWT来扩展它。最后，我们将创建一个受保护的路由，用于检查请求上的有效JWT。

首先，我们需要安装所需的软件包。Passport提供了一种名为Passport-local的策略，它实现了一种用户名/密码身份验证机制，这符合我们在这一部分用例中的需求。

```
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
```

对于您选择的任何Passport策略，都需要@nestjs/Passport和Passport包。然后，需要安装特定策略的包(例如，passport-jwt或passport-local)，它实现您正在构建的特定身份验证策略。此外，您还可以安装任何Passport策略的类型定义，如上面的@types/Passport-local所示，它在编写TypeScript代码时提供了帮助。

### Passport 策略

现在可以实现身份认证功能了。我们将首先概述用于任何Passport策略的流程。将Passport本身看作一个框架是有帮助的。框架的优雅之处在于，它将身份验证过程抽象为几个基本步骤，您可以根据实现的策略对这些步骤进行自定义。它类似于一个框架，因为您可以通过提供定制参数(作为JSON对象)和回调函数(Passport在适当的时候调用这些回调函数)的形式来配置它。@nestjs/passport模块将该框架包装在一个Nest风格的包中，使其易于集成到Nest应用程序中。下面我们将使用@nestjs/passport，但首先让我们考虑一下vanilla Passport是如何工作的。

在vanilla Passport中，您可以通过提供以下两项配置策略:

1. 组特定于该策略的选项。例如，在JWT策略中，您可以提供一个秘令来对令牌进行签名。
2. "验证回调"，在这里您可以告诉Passport如何与您的用户存储交互(在这里您可以管理用户帐户)。在这里，验证用户是否存在(或创建一个新用户)，以及他们的凭据是否有效。Passport库期望这个回调在验证成功时返回完整的用户消息，在验证失败时返回null(失败定义为用户没有找到，或者在使用Passport-local的情况下，密码不匹配)。

使用@nestjs/passport，您可以通过扩展PassportStrategy类来配置passport策略。通过调用子类中的super()方法传递策略选项(上面第1项)，可以选择传递一个options对象。通过在子类中实现validate()方法，可以提供verify回调(上面第2项)。

我们将从生成一个AuthModule开始，其中有一个AuthService:

```
$ nest g module auth
$ nest g service auth
```

当我们实现AuthService时，我们会发现在UsersService中封装用户操作是很有用的，所以现在让我们生成这个模块和服务:

```
$ nest g module users
$ nest g service users
```

替换这些生成文件的默认内容，如下所示。对于我们的示例应用程序，UsersService只是在内存中维护一个硬编码的用户列表，以及一个根据用户名检索用户列表的find方法。在真正的应用程序中，这是您使用选择的库(例如TypeORM、Sequelize、Mongoose等)构建用户模型和持久层。

> users/users.service.ts

```
import { Injectable } from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
  private readonly users: User[];

  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'chris',
        password: 'secret',
      },
      {
        userId: 3,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
```

在UsersModule中，惟一需要做的更改是将UsersService添加到@Module装饰器的exports数组中，以便提供给其他模块外部可见(我们很快将在AuthService中使用它)。

> users/users.module.ts

```
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

我们的AuthService的任务是检索用户并验证密码。为此，我们创建了validateUser()方法。在下面的代码中，我们使用ES6扩展操作符从user对象中提取password属性，然后再返回它。稍后，我们将从Passport本地策略中调用validateUser()方法。

> auth/auth.service.ts

```
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
```

?> 当然，在实际的应用程序中，您不会以纯文本形式存储密码。 取而代之的是使用带有加密单向哈希算法的bcrypt之类的库。使用这种方法，您只需存储散列密码，然后将存储的密码与输入密码的散列版本进行比较，这样就不会以纯文本的形式存储或暴露用户密码。为了保持我们的示例应用程序的简单性，我们违反了这个绝对命令并使用纯文本。不要在真正的应用程序中这样做!

现在，我们更新AuthModule来导入UsersModule。

> auth/auth.module.ts

```
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
```

现在我们可以实现Passport本地身份验证策略。在auth文件夹中创建一个名为local.strategy.ts文件，并添加以下代码:

> auth/local.strategy.ts

```
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

我们遵循了前面描述的所有护照策略。在我们的passport-local用例中，没有配置选项，因此我们的构造函数只是调用super()，没有options对象。

我们还实现了validate()方法。对于每个策略，Passport将使用适当的特定于策略的一组参数调用verify函数(使用@nestjs/Passport中的validate()方法实现)。对于本地策略，Passport需要一个具有以下签名的validate()方法:validate(username: string, password: string): any。

大多数验证工作是在我们的AuthService中完成的(在UserService的帮助下)，所以这个方法非常简单。任何Passport策略的validate()方法都将遵循类似的模式，只是表示凭证的细节方面有所不同。如果找到了用户并且凭据有效，则返回该用户，以便Passport能够完成其任务(例如，在请求对象上创建user属性)，并且请求处理管道可以继续。如果没有找到，我们抛出一个异常，让异常层处理它。

通常，每种策略的validate()方法的惟一显著差异是如何确定用户是否存在和是否有效。例如，在JWT策略中，根据需求，我们可以评估解码令牌中携带的userId是否与用户数据库中的记录匹配，或者是否与已撤销的令牌列表匹配。因此，这种子类化和实现特定于策略验证的模式是一致的、优雅的和可扩展的。

我们需要配置AuthModule来使用刚才定义的Passport特性。更新auth.module。看起来像这样:

> auth/auth.module.ts

```
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
```

### 内置 Passport 守卫

守卫章节描述了守卫的主要功能:确定请求是否由路由处理程序。这仍然是正确的，我们将很快使用这个标准功能。但是，在使用@nestjs/passport模块的情况下，我们还将引入一个新的小问题，这个问题一开始可能会让人感到困惑，现在让我们来讨论一下。从身份验证的角度来看，您的应用程序可以以两种状态存在:

1. 用户/客户端未登录(未通过身份验证)
2. 用户/客户端已登录(已通过身份验证)

在第一种情况下(用户没有登录)，我们需要执行两个不同的功能:

- 限制未经身份验证的用户可以访问的路由（即拒绝访问受限制的路由）。 我们将使用熟悉的警卫来处理这个功能，方法是在受保护的路由上放置一个警卫。我们将在这个守卫中检查是否存在有效的JWT，所以我们稍后将在成功发出JWT之后处理这个守卫。
- 当以前未经身份验证的用户尝试登录时，启动身份验证步骤。这时我们向有效用户发出JWT的步骤。考虑一下这个问题，我们知道需要POST用户名/密码凭证来启动身份验证，所以我们将设置POST/auth/login路径来处理这个问题。这就提出了一个问题:在这条路由上，我们究竟如何实施“护照-本地”战略?

答案很简单:使用另一种稍微不同类型的守卫。@nestjs/passport模块为我们提供了一个内置的守卫，可以完成这一任务。这个保护调用Passport策略并启动上面描述的步骤(检索凭证、运行verify函数、创建用户属性等)。

上面列举的第二种情况(登录用户)仅仅依赖于我们已经讨论过的标准类型的守卫，以便为登录用户启用对受保护路由的访问。

### 登录路由

有了这个策略，我们现在就可以实现一个简单的/auth/login路由，并应用内置的守卫来启动护照本地流。 打开app.controller.ts文件，并将其内容替换为以下内容:

> app.controller.ts

```
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return req.user;
  }
}
```

对于@useguard(AuthGuard('local'))，我们使用的是一个AuthGuard，它是在我们扩展护照-本地策略时@nestjs/passportautomatic为我们准备的。我们来分析一下。我们的Passport本地策略默认名为"local"。我们在@UseGuards()装饰器中引用这个名称，以便将它与护照本地包提供的代码关联起来。这用于消除在应用程序中有多个Passport策略时调用哪个策略的歧义(每个策略可能提供一个特定于策略的AuthGuard)。虽然到目前为止我们只有一个这样的策略，但我们很快就会添加第二个，所以这是消除歧义所需要的。

为了测试我们的路由，我们将/auth/login路由简单地返回用户。这还允许我们演示另一个Passport特性:Passport根据从validate()方法返回的值自动创建一个user对象，并将其作为req.user分配给请求对象。稍后，我们将用创建并返回JWT的代码替换它。

因为这些是API路由，所以我们将使用常用的cURL库来测试它们。您可以使用UsersService中硬编码的任何用户对象进行测试。

```
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"userId":1,"username":"john"}
```

### JWT 功能

我们已经准备好进入JWT部分的认证系统。让我们回顾并完善我们的需求:

- 允许用户使用用户名/密码进行身份验证，返回JWT以便在后续调用受保护的API端点时使用。我们正在努力满足这一要求。为了完成它，我们需要编写发出JWT的代码。
- 创建基于token的有效JWT的存在而受保护的API路由。

我们需要安装更多的包来支持我们的JWT需求:

```
$ npm install @nestjs/jwt passport-jwt
$ npm install @types/passport-jwt --save-dev
```

@nest/jwt包是一个实用程序包，可以帮助jwt操作。passport-jwt包是实现JWT策略的Passport包，@types/passport-jwt提供TypeScript类型定义。

让我们仔细看看如何处理POST/auth/login请求。我们使用护照本地策略提供的内置AuthGuard来装饰路由。这意味着:

1. 只有在验证了用户之后，才会调用路由处理程序
2. req参数将包含一个用户属性(在passport-local 身份验证流期间由Passport填充)

考虑到这一点，我们现在终于可以生成一个真正的JWT，并以这种方式返回它。为了使我们的服务保持干净的模块化，我们将在authService中生成JWT。在auth文件夹中添加auth.service.ts文件，并添加login()方法，导入JwtService，如下图所示:

> auth/auth.service.ts

```
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

我们使用@nestjs/jwt库，该库提供了一个sign()函数，用于从用户对象属性的子集生成jwt，然后以简单对象的形式返回一个access_token属性。注意:我们选择sub的属性名来保持我们的userId值与JWT标准一致。不要忘记将JwtService提供者注入到AuthService中。

现在，我们需要更新AuthModule来导入新的依赖项并配置JwtModule。

首先，在auth文件夹下创建auth/constants.ts，并添加以下代码:

> auth/constants.ts

```
export const jwtConstants = {
  secret: 'secretKey',
};
```

我们将使用它在JWT签名和验证步骤之间共享密钥。

不要公开公开此密钥。我们在这里这样做是为了清楚地说明代码在做什么，但是在生产系统中，您必须使用适当的措施来保护这个密钥，比如机密库、环境变量或配置服务。

现在,在auth文件夹下auth.module.ts，并更新它看起来像这样:

```
auth/auth.module.tsJS

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

我们使用register()配置JwtModule，并传入一个配置对象。有关Nest JwtModule的更多信息请参见[此处](https://github.com/nestjs/jwt/blob/master/README.md)，有关可用配置选项的更多信息请参见[此处](https://github.com/auth0/node-jsonwebtoken#usage)。

现在我们可以更新/auth/login路径来返回JWT。

> app.controller.ts

```
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
```

让我们继续使用cURL测试我们的路由。您可以使用UsersService中硬编码的任何用户对象进行测试。

```
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
```

### 实施 Passport JWT

我们现在可以处理我们的最终需求:通过要求在请求时提供有效的JWT来保护端点。护照对我们也有帮助。它提供了用于用JSON Web标记保护RESTful端点的passport-jwt策略。在auth文件夹中jwt.strategy.ts，并添加以下代码:

> auth/jwt.strategy.ts

```
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

对于我们的JwtStrategy，我们遵循了前面描述的所有Passport策略的相同配方。这个策略需要一些初始化，因此我们通过在super()调用中传递一个options对象来实现。您可以在[这里](https://github.com/mikenicholson/passport-jwt#configure-strategy)阅读关于可用选项的更多信息。在我们的例子中，这些选项是:

- jwtFromRequest:提供从请求中提取JWT的方法。我们将使用在API请求的授权头中提供token的标准方法。这里描述了其他选项。

ignoreExpiration:为了明确起见，我们选择默认的false设置，它将确保JWT没有过期的责任委托给Passport模块。这意味着，如果我们的路由提供了一个过期的JWT，请求将被拒绝，并发送401未经授权的响应。护照会自动为我们办理。

secret orkey:我们使用权宜的选项来提供对称的秘密来签署令牌。其他选项，如pemo编码的公钥，可能更适合于生产应用程序(有关更多信息，请参见[此处](https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request))。如前所述，无论如何，不要把这个秘密公开。

validate()方法值得讨论一下。对于JWT策略，Passport首先验证JWT的签名并解码JSON。然后调用我们的validate()方法，该方法将解码后的JSON作为其单个参数传递。根据JWT签名的工作方式，我们可以保证接收到之前已签名并发给有效用户的有效token令牌。

因此，我们对validate()回调的响应很简单:我们只是返回一个包含userId和username属性的对象。再次回忆一下，Passport将基于validate()方法的返回值构建一个user对象，并将其作为属性附加到请求对象上。

同样值得指出的是，这种方法为我们留出了将其他业务逻辑注入流程的空间(就像"挂钩"一样)。例如，我们可以在validate()方法中执行数据库查询，以提取关于用户的更多信息，从而在请求中提供更丰富的用户对象。这也是我们决定进行进一步令牌验证的地方，例如在已撤销的令牌列表中查找userId，使我们能够执行令牌撤销。我们在示例代码中实现的模型是一个快速的"无状态JWT"模型，其中根据有效JWT的存在立即对每个API调用进行授权，并在请求管道中提供关于请求者(其userid和username)的少量信息。

在AuthModule中添加新的JwtStrategy作为提供者:

> auth/auth.module.ts

```
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

通过导入JWT签名时使用的相同密钥，我们可以确保Passport执行的验证阶段和AuthService执行的签名阶段使用公共密钥。

实现受保护的路由和JWT策略保护，我们现在可以实现受保护的路由及其相关的保护。

打开app.controller.ts文件，更新如下:

> app.controller.ts

```
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

同样，我们将应用在配置passport-jwt模块时@nestjs/passport模块自动为我们提供的AuthGuard。这个保护由它的默认名称jwt引用。当我们请求GET /profile路由时，保护程序将自动调用我们的passport-jwt自定义配置逻辑，验证JWT，并将用户属性分配给请求对象。

确保应用程序正在运行，并使用cURL测试路由。

```
$ # GET /profile
$ curl http://localhost:3000/profile
$ # result -> {"statusCode":401,"error":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # result -> {"userId":1,"username":"john"}
```

注意，在AuthModule中，我们将JWT配置为60秒过期。这个过期时间可能太短了，而处理令牌过期和刷新的细节超出了本文的范围。然而，我们选择它来展示JWT的一个重要品质和jwt护照战略。如果您在验证之后等待60秒再尝试GET /profile请求，您将收到401未授权响应。这是因为Passport会自动检查JWT的过期时间，从而省去了在应用程序中这样做的麻烦。

我们现在已经完成了JWT身份验证实现。JavaScript客户端(如Angular/React/Vue)和其他JavaScript应用程序现在可以安全地与我们的API服务器进行身份验证和通信。

### 默认策略

在我们的AppController中，我们在@AuthGuard()装饰器中传递策略的名称。我们需要这样做，因为我们已经介绍了两种Passport策略(护照本地策略和护照jwt策略)，这两种策略都提供了各种Passport组件的实现。传递名称可以消除我们链接到的实现的歧义。当应用程序中包含多个策略时，我们可以声明一个默认策略，这样如果使用该默认策略，我们就不必在@AuthGuard装饰器中传递名称。下面介绍如何在导入PassportModule时注册默认策略。这段代码将进入AuthModule:

要确定默认策略行为，您可以注册PassportModule。

> auth.module.ts

```
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
    UsersModule
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 自定义 Passport

根据所使用的策略，护照会采用一系列影响库行为的属性。使用register()方法将选项对象直接传递给护照实例。

```
PassportModule.register({ session: true });
```

您还可以在策略的构造函数中传递一个options对象来配置它们。至于本地策略，你可以通过例如:

```
constructor(private readonly authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
```

看看[Passport Website](http://www.passportjs.org/docs/oauth/)官方文档吧。

### 命名策略

在实现策略时，可以通过向PassportStrategy函数传递第二个参数来为其提供名称。如果你不这样做，每个战略将有一个默认的名称(例如，"jwt"的jwt策略 ):

```
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
```

然后，通过一个像@AuthGuard('myjwt')这样的装饰器来引用它。

### GraphQL

为了使用带有GraphQL的AuthGuard，扩展内置的AuthGuard类并覆盖getRequest()方法。

```
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

要使用上述结构，请确保在GraphQL模块设置中将request (req)对象作为上下文值的一部分传递:

```
GraphQLModule.forRoot({
  context: ({ req }) => ({ req }),
});
```

要在graphql解析器中获得当前经过身份验证的用户，可以定义一个用户装饰器:

```
import { createParamDecorator } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (data, [root, args, ctx, info]) => ctx.req.user,
);
```

要在解析器中使用上述装饰器，请确保将其作为查询的参数:

```typescript
@Query(returns => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.userService.findById(user.id);
}
```

