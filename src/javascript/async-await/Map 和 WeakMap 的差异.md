# Map 和 WeakMap 的差异

------

稍等，别打人，别打脸

好了，我们来正儿八经的分析一波。

##### 差异

1. ###### 首先构造函数名不同嘛

```jsx
let map = new Map();
let weakmap = new WeakMap();
```

1. ###### 内置API有差异

`Map`的API有：
(1) [Map.prototype.clear()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fclear)
(2) [Map.prototype.delete()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fdelete)
(3) [Map.prototype.entries()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fentries)
(4) [Map.prototype.forEach()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2FforEach)
(5) [Map.prototype.get()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fget)
(6) [Map.prototype.has()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fhas)
(7) [Map.prototype.keys()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fkeys)
(8) [Map.prototype.set()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fset)
(9) [Map.prototype.values()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2Fvalues)
(10) [Map.prototype[@@iterator]()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FMap%2F%40%40iterator)
`WeakMap`的API有：
（1） [WeakMap.prototype.delete()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FWeakMap%2Fdelete)
（2） [WeakMap.prototype.get()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FWeakMap%2Fget)
（3） [WeakMap.prototype.has()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FWeakMap%2Fhas)
（4） [WeakMap.prototype.set()](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FWeakMap%2Fset)
可以看出`weakMap` api少了`clear， entries，forEach，keys，values,以及获取iterator对象的方法`，另外`weakMap`还没有`size`属性，无法获取内部存了多少个映射。

1. ###### 可以用来设置键的类型

***Map\***可以用JS的***任意类型\***作为键。***WeakMap\***的话***只能是对象\***。

```csharp
let weakMap = new WeakMap();
weakMap.set('14', '14'); // Uncaught TypeError: Invalid value used as weak map key
                         //at WeakMap.set (<anonymous>)
```

1. ###### GC(垃圾回收)。

```csharp
let a = {x: 12};
let b = {y: 13};

let map = new Map();
let weakMap = new WeakMap();
map.set(a, '14');
weakMap.set(b, '15');

a = null;
b = null; // 设置为null提醒垃圾回收可以回收了。
```

当把a, b都设置成null之后，GC会回收weakMap中的b对象对应的键值对（这里的意思是键和值都回收），也就是`{ y: 13}`这个对象会被回收，`'14'`这个常量也会被清除。但是不会回收Map中a对象对应的键值对，也就是`{x: 12}`这个对象并不会回收。

***`WeakMap`中值被回收，是因为键被回收了\***

```csharp
let a = {x: 12};
let b = {y: 15};
let weakMap = new WeakMap();
weakMap.set(a, b);
console.log(weakMap.get(a));
b = null; // 这样做不会影响weakMap的存储
console.log(weakMap.get(a));
```

##### 多说几句

Map的使用，用在值需要频繁的删改的场景（map有优化），以及键只能是对象的场景比较优。如果只是简单的记录值而且键不会是对象的情况，用普通对象就OK了。