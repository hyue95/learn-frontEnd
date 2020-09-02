# vue-property-decorator用法

### vue-property-decorator

这个组件完全依赖于`vue-class-component`.它具备以下几个属性:

- @Component (完全继承于`vue-class-component`)
- @Emit
- @Inject
- @Provice
- @Prop
- @Watch
- @Model
- Mixins (在`vue-class-component`中定义);

### 使用

当我们在`vue`单文件中使用`TypeScript`时,引入`vue-property-decorator`之后,`script`中的标签就变为这样:



```dart
<script lang="ts">
    import {Vue, Component} from 'vue-property-decorator';

    @Component({})
    export default class "组件名" extends Vue{
        ValA: string = "hello world";
        ValB: number = 1;
    }
</script>
```

等同于



```xml
<script lang="es6">
    import Vue from 'vue';

    export default {
        data(){
            return {
                ValA: 'hello world',
                ValB: 1
            }
        }
    }
</script>
```

- 总结: 对于`data`里的变量对顶,我们可以直接按`ts`定义类变量的写法写就可以

那么如果是计算属性呢? 这就要用到`getter`了.



```dart
<script lang="ts">
    import {Vue, Component} from 'vue-property-decorator';

    @Component({})
    export default class "组件名" extends Vue{
        get ValA(){
            return 1;
        }
    }
</script>
```

等同于



```xml
<script lang="es6">
    import Vue from 'vue';

    export default {
        computed: {
            ValA: function() {
                return 1;
            }
        }
    }
</script>
```

- 总结: 对于`Vue`中的计算属性,我们只需要将该计算属性名定义为一个函数,并在函数前加上`get`关键字即可.

原本`Vue`中的`computed`里的每个计算属性都变成了在前缀添加`get`的函数.

------

### @Emit

关于`Vue`中的事件的监听与触发,`Vue`提供了两个函数`$emit`和`$on`.那么在`vue-property-decorator`中如何使用呢?
这就需要用到`vue-property-decorator`提供的`@Emit`属性.



```dart
<script lang="ts">
    import {Vue, Component, Emit} from 'vue-property-decorator';

    @Component({})
    export default class "组件名" extends Vue{
        mounted(){
            this.$on('emit-todo', function(n) {
                console.log(n)
            })

            this.emitTodo('world');
        }

            @Emit()
        emitTodo(n: string){
            console.log('hello');
        }
    }
</script>
```

运行上面的代码会打印 'hello' 'world', 为什么呢? 让我们来看看它等同于什么



```xml
<script lang="es6">
    import Vue from 'vue';

    export default {
        mounted(){
            this.$on('emit-todo', function(n) {
                console.log(n)
            })

            this.emitTodo('world');
        },
        methods: {
            emitTodo(n){
                console.log('hello');
                this.$emit('emit-todo', n);
            }
        }
    }
</script>
```

可以看到,在`@Emit`装饰器的函数会在运行之后触发等同于其函数名(`驼峰式会转为横杠式写法`)的事件, 并将其函数传递给`$emit`.
如果我们想触发特定的事件呢,比如在`emitTodo`下触发`reset`事件:



```dart
<script lang="ts">
    import {Vue, Component, Emit} from 'vue-property-decorator';

    @Component({})
    export default class "组件名" extends Vue{

        @Emit('reset')
        emitTodo(n: string){

        }
    }
</script>
```

我们只需要给装饰器`@Emit`传递一个事件名参数`reset`,这样函数`emitTodo`运行之后就会触发`reset`事件.

- 总结:在`Vue`中我们是使用`$emit`触发事件,使用`vue-property-decorator`时,可以借助`@Emit`装饰器来实现.`@Emit`修饰的函数所接受的参数会在运行之后触发事件的时候传递过去.
  `@Emit`触发事件有两种写法

1. `@Emit()`不传参数,那么它触发的事件名就是它所修饰的函数名.
2. `@Emit(name: string)`,里面传递一个字符串,该字符串为要触发的事件名.

------

### @Watch

我们可以利用`vue-property-decorator`提供的`@Watch`装饰器来替换`Vue`中的`watch`属性,以此来监听值的变化.

在`Vue`中监听器的使用如下:



```dart
export default{
    watch: {
        'child': this.onChangeValue
            // 这种写法默认 `immediate`和`deep`为`false`
        ,
        'person': {
            handler: 'onChangeValue',
            immediate: true,
            deep: true
        }
    },
    methods: {
        onChangeValue(newVal, oldVal){
            // todo...
        }
    }
}
```

那么我们如何使用`@Watch`装饰器来改造它呢?



```tsx
import {Vue, Component, Watch} from 'vue-property-decorator';

@Watch('child')
onChangeValue(newVal: string, oldVal: string){
    // todo...
}

@Watch('person', {immediate: true, deep: true})
onChangeValue(newVal: Person, oldVal: Person){
    // todo...
}
```

- 总结: `@Watch`使用非常简单,接受第一个参数为要监听的属性名 第二个属性为可选对象.`@Watch`所装饰的函数即监听到属性变化之后的操作.

------

### @Prop

我们在使用`Vue`时有时会遇到子组件接收父组件传递来的参数.我们需要定义`Prop`属性.

比如子组件从父组件接收三个属性`propA`,`propB`,`propC`.

- `propA`类型为`Number`
- `propB`默认值为`default value`
- `propC`类型为`String`或者`Boolean`



```css
export default {
  props: {
    propA: {
      type: Number
    },
    propB: {
      default: 'default value'
    },
    propC: {
      type: [String, Boolean]
    },
  }
}
```

我们使用`vue-property-decorator`提供的`@Prop`可以将上面的代码改造为如下:



```dart
<script lang="ts">
    import {Vue, Component, Prop} from 'vue-property-decorator';

    @Component({})
    export default class "组件名" extends Vue{
        @Prop(Number) propA!: number;
        @Prop({default: 'default value'}) propB!: string;
        @propC([String, Boolean]) propC: string | boolean;
    }
</script>
```

> 这里 `!`和可选参数`?`是相反的, `!`告诉`TypeScript`我这里一定有值.

- 总结: `@Prop`接受一个参数可以是类型变量或者对象或者数组.`@Prop`接受的类型比如`Number`是`JavaScript`的类型,之后定义的属性类型则是`TypeScript`的类型.

------

#### Mixins

在使用`Vue`进行开发时我们经常要用到混合,结合`TypeScript`之后我们有两种`mixins`的方法.

一种是`vue-class-component`提供的.



```jsx
//定义要混合的类 mixins.ts
import Vue from 'vue';
import  Component  from 'vue-class-component';

@Component  // 一定要用Component修饰
export default class myMixins extends Vue {
    value: string = "Hello"
}
```



```jsx
// 引入
import  Component  {mixins}  from 'vue-class-component';
import myMixins from 'mixins.ts';

@Component
export class myComponent extends mixins(myMixins) {
                          // 直接extends myMinxins 也可以正常运行
      created(){
          console.log(this.value) // => Hello
    }
}
```

第二种方式是在`@Component`中混入.

我们改造一下`mixins.ts`,定义`vue/type/vue`模块,实现`Vue`接口



```tsx
// mixins.ts
import { Vue, Component } from 'vue-property-decorator';


declare module 'vue/types/vue' {
    interface Vue {
        value: string;
    }
}

@Component
export default class myMixins extends Vue {
    value: string = 'Hello'
}
```

混入



```jsx
import { Vue, Component, Prop } from 'vue-property-decorator';
import myMixins from '@static/js/mixins';

@Component({
    mixins: [myMixins]
})
export default class myComponent extends Vue{
    created(){
        console.log(this.value) // => Hello
    }
}
```

- 总结: 两种方式不同的是在定义`mixins`时如果没有定义`vue/type/vue`模块, 那么在混入的时候就要`继承`该`mixins`; 如果定义`vue/type/vue`模块,在混入时可以在`@Component`中`mixins`直接混入.

------

#### @Model

`Vue`组件提供`model`: `{prop?: string, event?: string}`让我们可以定制`prop`和`event`.
默认情况下，一个组件上的`v-model` 会把 `value`用作 `prop`且把 `input`用作 `event`，但是一些输入类型比如单选框和复选框按钮可能想使用 `value prop`来达到不同的目的。使用`model`选项可以回避这些情况产生的冲突。

- 下面是`Vue`官网的例子



```csharp
Vue.component('my-checkbox', {
  model: {
    prop: 'checked',
    event: 'change'
  },
  props: {
    // this allows using the `value` prop for a different purpose
    value: String,
    // use `checked` as the prop which take the place of `value`
    checked: {
      type: Number,
      default: 0
    }
  },
  // ...
})
```



```xml
<my-checkbox v-model="foo" value="some value"></my-checkbox>
```

上述代码相当于：



```csharp
<my-checkbox
  :checked="foo"
  @change="val => { foo = val }"
  value="some value">
</my-checkbox>
```

即`foo`双向绑定的是组件的`checke`, 触发双向绑定数值的事件是`change`

使用`vue-property-decorator`提供的`@Model`改造上面的例子.



```tsx
import { Vue, Component, Model} from 'vue-property-decorator';

@Component
export class myCheck extends Vue{
   @Model ('change', {type: Boolean})  checked!: boolean;
}
```

- 总结, `@Model()`接收两个参数, 第一个是`event`值, 第二个是`prop`的类型说明, 与`@Prop`类似, 这里的类型要用`JS`的. 后面在接着是`prop`和在`TS`下的类型说明.