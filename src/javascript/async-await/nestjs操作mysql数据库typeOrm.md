# Nestjs操作mysql数据库_Nestjs typeOrm

**NestJs仿小米商城项目实战视频教程(视频+课件+源码)**： https://www.itying.com/goods-1139.html



## Nestjs数据库

Nest与数据库无关，允许您轻松地与任何SQL或NoSQL数据库集成。根据您的偏好，您有许多可用的选项。一般来说，将Nest连接到数据库只需为数据库加载一个适当的Node.js驱动程序，就像使用 [Express](https://expressjs.com/en/guide/database-integration.html) 或Fastify一样。

您还可以直接使用任何通用的Node.js数据库集成库或ORM，例如 [Sequelize (recipe)](https://www.npmjs.com/package/sequelize)、[knexjs](http://knexjs.org/) (tutorial)`和 [TypeORM](https://github.com/typeorm/typeorm) ，以在更高的抽象级别上进行操作。

为了方便起见，Nest还提供了与现成的TypeORM与@nestjs/typeorm的紧密集成，我们将在本章中对此进行介绍，而与@nestjs/mongoose的紧密集成将在本章中介绍。这些集成提供了附加的特定于nestjs的特性，比如模型/存储库注入、可测试性和异步配置，从而使访问您选择的数据库更加容易。

### Nestjs TypeORM 集成

为了与SQL和NoSQL数据库集成，Nest提供了@nestjs/typeorm包。Nest使用[TypeORM](https://github.com/typeorm/typeorm)是因为它是TypeScript中最成熟的对象关系映射器(ORM)。因为它是用TypeScript编写的，所以可以很好地与Nest框架集成。

为了开始使用它，我们首先安装所需的依赖项。在本章中，我们将演示如何使用流行的 [Mysql](https://www.mysql.com/) ，TypeORM提供了对许多关系数据库的支持，比如PostgreSQL、Oracle、Microsoft SQL Server、SQLite，甚至像MongoDB这样的NoSQL数据库。我们在本章中介绍的过程对于TypeORM支持的任何数据库都是相同的。您只需为所选数据库安装相关的客户端API库。

```
$ npm install --save @nestjs/typeorm typeorm mysql
```

安装过程完成后，我们可以将TypeOrmModule导入AppModule。

> app.module.ts

```
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

forRoot()方法接受与来自TypeORM包的createConnection()相同的配置对象。另外，我们可以创建ormconfig.json，而不是将配置对象传递给forRoot()。

```
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "root",
  "database": "test",
  "entities": ["dist/**/*.entity{.ts,.js}"],
  "synchronize": true
}
```

?> 静态全局路径(例如dist/**/*.entity{ .ts,.js})不适用于Webpack热重载。

然后，我们可以调用forRoot()没有任何选项:

> app.module.ts

```
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot()],
})
export class AppModule {}
```

一旦完成，TypeORM连接和EntityManager对象就可以在整个项目中注入(不需要导入任何模块)，例如:

> app.module.ts

```
import { Connection } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), PhotoModule],
})
export class AppModule {
  constructor(private readonly connection: Connection) {}
}
```

### 存储库模式

TypeORM支持存储库设计模式，因此每个实体都有自己的存储库。可以从数据库连接获得这些存储库。

为了继续这个示例，我们需要至少一个实体。我们将使用官方TypeORM文档中的Photo实体。

> photo/photo.entity.ts

```
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}
```

该Photo实体属于该photo目录。这个目录代表了PhotoModule。这是你决定在哪里保留你的模型文件。从我的观点来看，最好的方法是将它们放在他们的域中, 放在相应的模块目录中。

开始使用photo实体，我们需要让TypeORM知道它插入实体数组:

> app.module.ts

```
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo/photo.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [Photo],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

现在让我们看一下PhotoModule：

> photo.module.ts

```
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { Photo } from './photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

此模块使用forFeature()方法定义在当前范围中注册哪些存储库。这样，我们就可以使用@InjectRepository()装饰器将PhotoRepository注入到PhotoService中:

> photo.service.ts

```
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
}
```

?> 不要忘记将PhotoModule导入根ApplicationModule。

如果要在导入TypeOrmModule.forFeature的模块之外使用存储库，则需要重新导出由其生成的提供程序。 您可以通过导出整个模块来做到这一点，如下所示：

> photo.module.ts

```
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  exports: [TypeOrmModule]
})
export class PhotoModule {}
```

现在，如果我们在PhotoHttpModule中导入PhotoModule，我们可以在后一个模块的提供者中使用@InjectRepository(Photo)。

> photo-http.module.ts

```
import { Module } from '@nestjs/common';
import { PhotoModule } from './photo.module';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';

@Module({
  imports: [PhotoModule],
  providers: [PhotoService],
  controllers: [PhotoController]
})
export class PhotoHttpModule {}
```

### 多个数据库

某些项目可能需要多个数据库连接。幸运的是，这也可以通过本模块实现。要使用多个连接，首先要做的是创建这些连接。在这种情况下，连接命名成为必填项。

假设你有一个Person实体和一个Album实体，每个实体都存储在他们自己的数据库中。

```
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'photo_db_host',
      entities: [Photo],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'personsConnection',
      host: 'person_db_host',
      entities: [Person],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

?> 如果未为连接设置任何name，则该连接的名称将设置为default。请注意，不应该有多个没有名称或同名的连接，否则它们会被覆盖。

此时，您的Photo、Person和Album实体中的每一个都已在各自的连接中注册。通过此设置，您必须告诉TypeOrmModule.forFeature()函数和@InjectRepository()装饰器应该使用哪种连接。如果不传递任何连接名称，则使用default连接。

```
@Module({
  imports: [
    TypeOrmModule.forFeature([Photo]),
    TypeOrmModule.forFeature([Person], 'personsConnection'),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

您也可以为给定的连接注入Connection或EntityManager：

```
@Injectable()
export class PersonService {
  constructor(
    @InjectConnection('personsConnection')
    private readonly connection: Connection,
    @InjectEntityManager('personsConnection')
    private readonly entityManager: EntityManager,
  ) {}
}
```

### 测试

在单元测试我们的应用程序时，我们通常希望避免任何数据库连接，从而使我们的测试适合于独立，并使它们的执行过程尽可能快。但是我们的类可能依赖于从连接实例中提取的存储库。那是什么？解决方案是创建假存储库。为了实现这一点，我们设置了自定义提供者。事实上，每个注册的存储库都由entitynamereposition标记表示，其中EntityName是实体类的名称。

@nestjs/typeorm包提供了基于给定实体返回准备好token的getRepositoryToken()函数。

```
@Module({
  providers: [
    PhotoService,
    {
      provide: getRepositoryToken(Photo),
      useValue: mockRepository,
    },
  ],
})
export class PhotoModule {}
```

现在, 将使用硬编码mockRepository作为PhotoRepository。每当任何提供程序使用@InjectRepository()装饰器请求PhotoRepository时,Nest会使用注册的mockRepository对象。

### 定制存储库

TypeORM提供称为自定义存储库的功能。要了解有关它的更多信息，请访问此[页面](https://typeorm.io/#/custom-repository)。基本上，自定义存储库允许您扩展基本存储库类，并使用几种特殊方法对其进行丰富。

要创建自定义存储库，请使用@EntityRepository()装饰器和扩展Repository类。

```
@EntityRepository(Author)
export class AuthorRepository extends Repository<Author> {}
```

?>@EntityRepository()和Repository来自typeorm包。

创建类后，下一步是将实例化责任移交给Nest。为此，我们必须将AuthorRepository类传递给TypeOrm.forFeature()函数。

```
@Module({
  imports: [TypeOrmModule.forFeature([AuthorRepository])],
  controller: [AuthorController],
  providers: [AuthorService],
})
export class AuthorModule {}
```

之后，只需使用以下构造注入存储库：

```
@Injectable()
export class AuthorService {
  constructor(private readonly authorRepository: AuthorRepository) {}
}
```

### 异步配置

通常，您可能希望异步传递模块选项，而不是事先传递它们。在这种情况下，使用forRootAsync()函数，提供了几种处理异步数据的方法。

第一种可能的方法是使用工厂函数：

```
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  }),
});
```

我们的工厂的行为与任何其他异步提供者一样(例如，它可以是异步的，并且它能够通过注入注入依赖)。

```
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.getString('HOST'),
    port: configService.getString('PORT'),
    username: configService.getString('USERNAME'),
    password: configService.getString('PASSWORD'),
    database: configService.getString('DATABASE'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

或者，您可以使用类而不是工厂。

```
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
```

上面的构造将TypeOrmConfigService在内部进行实例化TypeOrmModule，并将利用它来创建选项对象。在TypeOrmConfigService必须实现TypeOrmOptionsFactory的接口。

```
@Injectable()
class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    };
  }
}
```

为了防止在TypeOrmModule中创建TypeOrmConfigService并使用从不同模块导入的提供程序，可以使用useExisting语法。

```
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

这个构造与useClass的工作原理相同，但有一个关键的区别 —TypeOrmModule将查找导入的模块来重用现有的ConfigService，而不是实例化一个新的ConfigService。

### 示例

[这儿](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm)有一个可用的例子。