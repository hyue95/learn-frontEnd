# Nestjs Mongoose_Nestjs 操作Mongodb数据库

**NestJs仿小米商城项目实战视频教程(视频+课件+源码)**： https://www.itying.com/goods-1139.html



## Nestjs Mongoose

Nest支持两种与 [MongoDB](http://www.mongodb.org/) 数据库集成的方式。既使用[ORM](https://github.com/typeorm/typeorm) 提供的 MongoDB 支撑或对象建模工具 [Mongoose](http://mongoosejs.com/)。选择ORM的话你可以按照以前的步骤使用typeorm。否则请使用我们Nest专用包:@nestjs/mongoose。

首先，我们需要安装所有必需的依赖项：

```
$ npm install --save @nestjs/mongoose mongoose
```

安装过程完成后，我们可以将其MongooseModule导入到根目录中ApplicationModule。

> app.module.ts

```
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

该forRoot()和 [mongoose](http://mongoosejs.com/) 包中的mongoose.connect()一样的参数对象。如下所述。

### 模型注入

cat.schema.ts文件驻在cats目录中的一个文件夹中，我们还在其中定义了CatsModule。虽然您可以将模式文件存储在您喜欢的任何地方，但是我们建议将它们存储在相关的域对象附近的适当模块目录中。

让我们来看看:

> cats.module.ts

```
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Cat', schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

MongooseModule提供了forFeature()方法来配置模块，包括定义应该在当前范围内注册哪些模型。如果您还想在另一个模块中使用模型，请将MongooseModule添加到CatsModule的导出部分，并在另一个模块中导入CatsModule。

注册模式后，可以使用@InjectModel()装饰器将Cat模型注入到CatsService中:

> cats.service.ts

```
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(@InjectModel('Cat') private readonly catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return await this.catModel.find().exec();
  }
}
```

### 测试

在单元测试我们的应用程序时，我们通常希望避免任何数据库连接，使我们的测试套件独立并尽可能快地执行它们。但是我们的类可能依赖于从连接实例中提取的模型。

为了简化这一过程，@nestjs/mongoose包公开了一个getModelToken()函数，该函数根据一个token名称返回一个准备好的注入token。使用此token，您可以轻松地使用任何标准自定义提供程序技术(包括useClass、useValue和useFactory)提供模拟实现。例如:

```
@@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken('Cat'),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
```

在本例中，每当任何使用者使用@InjectModel()装饰器注入模型时，都会提供一个硬编码的Model<Cat>(对象实例)。

### 异步配置

通常，您可能希望异步传递模块选项，而不是事先传递它们。在这种情况下，使用forRootAsync()方法，提供了几种处理异步数据的方法。

第一种可能的方法是使用工厂函数：

```
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
```

与其他工厂提供程序一样，我们的工厂函数可以是异步的，并且可以通过注入注入依赖。

```
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.getString('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
```

或者，您可以使用类而不是工厂来配置MongooseModule，如下所示:

```
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
```

上面的构造在MongooseModule中实例化了MongooseConfigService，使用它来创建所需的options对象。注意，在本例中，MongooseConfigService必须实现MongooseOptionsFactory接口，如下所示。MongooseModule将在提供的类的实例化对象上调用createMongooseOptions()方法。

```
@Injectable()
class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
```

为了防止MongooseConfigService内部创建MongooseModule并使用从不同模块导入的提供程序，您可以使用useExisting语法。

```
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

湖北众猿腾网络科技有限公司

[鄂公网安备 42050202000392号](http://www.beian.gov.cn/) [鄂ICP备17020565号-2](http://www.miitbeian.gov.cn/)