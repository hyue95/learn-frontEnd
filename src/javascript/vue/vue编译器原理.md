# [vue 编译原理 简介](https://www.cnblogs.com/dhsz/p/8462227.html)

[ 来源](http://mp.sohu.com/profile?xpt=ZnJvbnRlbmRzdG9yeUBzb2h1LmNvbQ==&_f=index_pagemp_1)

[tinycompile](https://github.com/jamiebuilds/the-super-tiny-compiler/blob/master/the-super-tiny-compiler.js)

关于vue的内部原理其实有很多个重要的部分，变化侦测，模板编译，virtualDOM，整体运行流程等。 

之前写过一篇《深入浅出 - vue变化侦测原理》 讲了关于变化侦测的实现原理。

那今天主要把 模板编译这部分的实现原理单独拿出来讲一讲。

本文我可能不会在文章中说太多细节部分的处理，我会把 vue 对模板编译这部分的整体原理讲清楚，主要是让读者读完文章后对模板编译的整体实现原理有一个清晰的思路和理解。

关于 Vue 编译原理这块的整体逻辑主要分三个部分，也可以说是分三步，这三个部分是有前后关系的：

- 第一步是将 模板字符串 转换成 element ASTs（解析器）
- 第二步是对 AST 进行静态节点标记，主要用来做虚拟DOM的渲染优化（优化器）
- 第三步是 使用 element ASTs 生成 render 函数代码字符串（代码生成器）

解析器

解析器主要干的事是将 模板字符串 转换成 element ASTs，例如：

< div> < p>{{name}}</ p></ div>

上面这样一个简单的 模板 转换成 element AST 后是这样的：

{ tag :"div"type :1, staticRoot :false, static :false, plain :true, parent :undefined, attrsList :[], attrsMap :{}, children :[ { tag :"p"type :1, staticRoot :false, static :false, plain :true, parent :{tag :"div", ...}, attrsList :[], attrsMap :{}, children :[{ type :2, text :"{{name}}", static :false, expression :"_s(name)"}] } ]}

我们先用这个简单的例子来说明这个解析器的内部究竟发生了什么。

这段模板字符串会扔到 while 中去循环，然后 一段一段的截取，把截取到的 每一小段字符串进行解析，直到最后截没了，也就解析完了。

上面这个简单的模板截取的过程是这样的：

< div> < p>{{name}}</ p></ div> < p>{{name}}</ p></ div> < p>{{name}}</ p></ div> {{name}}</ p></ div> </ p></ div> </ div> </ div>

那是根据什么截的呢？换句话说截取字符串有什么规则么？

当然有

只要判断模板字符串是不是以 < 开头我们就可以知道我们接下来要截取的这一小段字符串是 标签 还是 文本。

举个 🌰 ：

<div></div> 这样的一段字符串是以 < 开头的，那么我们通过正则把 <div> 这一部分 match 出来，就可以拿到这样的数据：

{ tagName :'div', attrs :[], unarySlash :'', start :0, end :5}

好奇如何用正则解析出 tagName 和 attrs 等信息的同学可以看下面这个demo代码：

constncname='[a-zA-Z_][w-.]*'constqnameCapture=`((?:${ncname}:)?${ncname})`conststartTagOpen=newRegExp( `^<${qnameCapture}`) conststartTagClose=/^s*(/?)>/lethtml =`<div></div>`letindex =0conststart=html. match(startTagOpen) constmatch={ tagName :start[ 1], attrs :[], start :0}html =html. substring(start[ 0]. length)index +=start[ 0]. lengthletend, attr while( !(end =html. match(startTagClose)) &&(attr =html. match(attribute))) { html =html. substring(attr[ 0]. length) index +=attr[ 0]. lengthmatch. attrs. push(attr)} if(end) { match. unarySlash=end[ 1] html =html. substring(end[ 0]. length) index +=end[ 0]. lengthmatch. end=index} console. log(match) Stack

用正则把 开始标签 中包含的数据（attrs, tagName 等）解析出来之后还要做一个很重要的事，就是要维护一个 stack。

那这个 stack 是用来干什么的呢？

这个 stack 是用来记录一个层级关系的，用来记录DOM的深度。

更准确的说，当解析到一个 开始标签 或者 文本，无论是什么， stack 中的最后一项，永远是当前正在被解析的节点的 parentNode 父节点。

通过 stack 解析器就可以把当前解析到的节点 push 到 父节点的 children 中。

也可以把当前正在解析的节点的 parent 属性设置为 父节点。

事实上也确实是这么做的。

但并不是只要解析到一个标签的开始部分就把当前标签 push 到 stack 中。

因为在 HTML 中有一种 自闭和标签，比如 input。

<input /> 这种 自闭和的标签 是不需要 push 到 stack 中的，因为 input 并不存在子节点。

所以当解析到一个标签的开始时，要判断当前被解析的标签是否是自闭和标签，如果不是自闭和标签才 push 到 stack 中。

if( !unary) { currentParent =element stack. push(element)}

现在有了 DOM 的层级关系，也可以解析出DOM的 开始标签，这样每解析一个 开始标签 就生成一个 ASTElement (存储当前标签的attrs，tagName 等信息的object）

并且把当前的 ASTElement push 到 parentNode 的 children 中，同时给当前 ASTElement 的 parent属性设置为 stack 中的最后一项

currentParent. children. push(element) element. parent=currentParent < 开头的几种情况

但并不是所有以 < 开头的字符串都是 开始标签，以 < 开头的字符串有以下几种情况：

- 开始标签 <div>
- 结束标签 </div>
- HTML注释 <!-- 我是注释 -->
- Doctype <!DOCTYPE html>
- 条件注释（Downlevel-revealed conditional comment）

当然我们解析器在解析的过程中遇到的最多的是 开始标签 结束标签 和 注释

截取文本

我们继续上面的例子解析，div 的 开始标签 解析之后剩余的模板字符串是下面的样子：

< p>{{name}}</ p></ div>

这一次我们在解析发现 模板字符串 不是以 < 开头了。

那么如果模板字符串不是以 < 开头的怎么处理呢？？

其实如果字符串不是以 < 开头可能会出现这么几种情况：

我是text < div></ div>

或者：

我是text </ p>

不论是哪种情况都会将标签前面的文本部分解析出来，截取这段文本其实并不难，看下面的例子：

//可以直接将本 demo 放到浏览器 console 中去执行consthtml='我是text </p>'lettextEnd =html. indexOf( '<') consttext=html. substring( 0, textEnd) console. log(text)

当然 vue 对文本的截取不只是这么简单，vue对文本的截取做了很安全的处理，如果 < 是文本的一部分，那上面 DEMO 中截取的内容就不是我们想要的，例如这样的：

a < b </ p>

如果是这样的文本，上面的 demo 肯定就挂了，截取出的文本就会遗漏一部分，而 vue 对这部分是进行了处理的，看下面的代码：

lettextEnd =html. indexOf( '<') lettext, rest, next if(textEnd >=0) { rest =html. slice(textEnd) //剩余部分的 HTML 不符合标签的格式那肯定就是文本//并且还是以 < 开头的文本while( !endTag. test(rest) &&!startTagOpen. test(rest) &&!comment. test(rest) &&!conditionalComment. test(rest) ) { //< in plain text, be forgiving and treat it as textnext =rest. indexOf( '<', 1) if(next <0) breaktextEnd +=next rest =html. slice(textEnd) } text =html. substring( 0, textEnd) html =html. substring( 0, textEnd)}

这段代码的逻辑是如果文本截取完之后，剩余的 模板字符串 开头不符合标签的格式规则，那么肯定就是有没截取完的文本

这个时候只需要循环把 textEnd 累加，直到剩余的 模板字符串 符合标签的规则之后在一次性把 text 从 模板字符串 中截取出来就好了。

继续上面的例子，当前剩余的 模板字符串 是这个样子的：

< p>{{name}}</ p></ div>

截取之后剩余的 模板字符串 是这个样子的：

< p>{{name}}</ p></ div>

被截取出来的文本是这样的：

"n"

截取之后就需要对文本进行解析，不过在解析文本之前需要进行预处理，也就是先简单加工一下文本，vue 是这样做的：

constchildren=currentParent. childrentext =inPre ||text. trim() ?isTextTag(currentParent) ?text :decodeHTMLCached(text) //only preserve whitespace if its not right after a starting tag:preserveWhitespace &&children. length?'':''

这段代码的意思是：

- 如果文本不为空，判断父标签是不是或style，

- 1. 如果是则什么都不管，
  2. 如果不是需要 decode 一下编码，使用github上的 he 这个类库的 decodeHTML 方法

- 如果文本为空，判断有没有兄弟节点，也就是 parent.children.length 是不是为 0

- 1. 如果大于0 返回 ' '
  2. 如果为 0 返回 ''

结果发现这一次的 text 正好命中最后的那个 ''，所以这一次就什么都不用做继续下一轮解析就好

继续上面的例子，现在的 模板字符串 变是这个样子：

< p>{{name}}</ p></ div>

接着解析 <p>，解析流程和上面的 <div> 一样就不说了，直接继续：

{{name}}</ p></ div>

通过上面写的文本的截取方式这一次截取出来的文本是这个样子的 "{{name}}"

解析文本

其实解析文本节点并不难，只需要将文本节点 push 到 currentParent.children.push(ast) 就行了。

但是带变量的文本和不带变量的纯文本是不同的处理方式。

带变量的文本是指 Hello {{ name }} 这个 name 就是变量。

不带变量的文本是这样的 Hello Berwin 这种没有访问数据的纯文本。

纯文本比较简单，直接将 文本节点的ast push 到 parent 节点的 children 中就行了，例如：

children. push({ type :3, text :'我是纯文本'})

而带变量的文本要多一个解析文本变量的操作：

constexpression=parseText(text, delimiters) //对变量解析 {{name}} => _s(name)children. push({ type :2, expression, text})

上面例子中 "{{name}}" 是一个带变量的文本，经过 parseText 解析后 expression 是 _s(name)，所以最后 push 到 currentParent.children 中的节点是这个样子的：

{ expression :"_s(name)", text :"{{name}}", type :2} 结束标签的处理

现在文本解析完之后，剩余的 模板字符串 变成了这个样子：

</ p></ div>

这一次还是用上面说的办法，html.indexOf('<') === 0，发现是 < 开头的，然后用正则去 match 发现符合 结束标签的格式，把它截取出来。

并且还要做一个处理是用当前标签名在 stack 从后往前找，将找到的 stack 中的位置往后的所有标签全部删除（意思是，已经解析到当前的结束标签，那么它的子集肯定都是解析过的，试想一下当前标签都关闭了，它的子集肯定也都关闭了，所以需要把当前标签位置往后从 stack中都清掉）

结束标签不需要解析，只需要将 stack 中的当前标签删掉就好。

虽然不用解析，但 vue 还是做了一个优化处理，children 中的最后一项如果是空格 " "，则删除最后这一项：

if(lastNode &&lastNode. type===3&&lastNode. text===''&&!inPre) { element. children. pop()}

因为最后这一项空格是没有用的，举个例子：

< ul> < li></ li></ ul>

上面例子中解析成 element ASTs之后 ul 的结束标签 </ul> 和 li 的结束标签 </li> 之间有一个空格，这个空格也属于文本节点在 ul 的 children 中，这个空格是没有用的，把这个空格删掉每次渲染dom都会少渲染一个文本节点，可以节省一定的性能开销。

现在剩余的 模板字符串 已经不多了，是下面的样子：

</ div>

然后解析文本，就是一个其实就是一个空格的文本节点。

然后再一次解析结束标签 </div>

</ div>

解析完毕退出 while 循环。

解析完之后拿到的 element ASTs 就是文章开头写的那样。

总结一下

其实这样一个模板解析器的原理不是特别难，主要就是两部分内容，一部分是 截取 字符串，一部分是对截取之后的字符串做 解析

每截取一段标签的开头就 push 到 stack中，解析到标签的结束就 pop 出来，当所有的字符串都截没了也就解析完了。

上文中的例子是比较简单的，不涉及一些循环啊，什么的，注释的处理这些也都没有涉及到，但其实这篇文章中想表达的内容也不是来扣细节的，如果扣细节可能要写一本小书才够，一篇文章的字数可能只够把一个大体的逻辑给大家讲清楚，希望同学们见谅，如果对细节感兴趣可以在下面评论，咱们一起讨论共同学习进步~

优化器

优化器的目标是找出那些静态节点并打上标记，而静态节点指的是 DOM 不需要发生变化的节点，例如：

< p>我是静态节点，我不需要发生变化</ p>

标记静态节点有两个好处：

1. 每次重新渲染的时候不需要为静态节点创建新节点
2. 在 Virtual DOM 中 patching 的过程可以被跳过

优化器的实现原理主要分两步：

- 第一步：用递归的方式将所有节点添加 static 属性，标识是不是静态节点
- 第二步：标记所有静态根节点

什么是静态根节点？ 答：子节点全是静态节点的节点就是静态根节点，例如：

< ul> < li>我是静态节点，我不需要发生变化</ li> < li>我是静态节点2，我不需要发生变化</ li> < li>我是静态节点3，我不需要发生变化</ li></ ul>

ul 就是静态根节点。

如何将所有节点标记 static 属性？

vue 判断一个节点是不是静态节点的做法其实并不难：

1. 先根据自身是不是静态节点做一个标记 node.static = isStatic(node)
2. 然后在循环 children，如果 children 中出现了哪怕一个节点不是静态节点，在将当前节点的标记修改成 false： node.static = false。

如何判断一个节点是不是静态节点？

也就是说 isStatic 这个函数是如何判断静态节点的？

functionisStatic( node:ASTNode): boolean { if( node. type===2) { //expressionreturnfalse} if( node. type===3) { //textreturntrue} return!!( node. pre||( !node. hasBindings&&//no dynamic bindings!node. if&&!node. for&&//not v-if or v-for or v-else!isBuiltInTag( node. tag) &&//not a built-inisPlatformReservedTag( node. tag) &&//not a component!isDirectChildOfTemplateFor(node) &&Object. keys(node). every(isStaticKey) ))}

先解释一下，在上文讲的解析器中将 模板字符串 解析成 AST 的时候，会根据不同的文本类型设置一个 type：

| type | 说明                 |
| ---- | -------------------- |
| 1    | 元素节点             |
| 2    | 带变量的动态文本节点 |
| 3    | 不带变量的纯文本节点 |

所以上面 isStatic 中的逻辑很明显，如果 type === 2 那肯定不是 静态节点 返回 false，如果 type === 3 那就是静态节点，返回 true。

那如果 type === 1，就有点复杂了，元素节点判断是不是静态节点的条件很多，咱们先一个个看。

首先如果 node.pre 为 true 直接认为当前节点是静态节点，关于 node.pre 是什么 请狠狠的点击我。

其次 node.hasBindings 不能为 true。

node.hasBindings 属性是在解析器转换 AST 时设置的，如果当前节点的 attrs 中，有 v-、@、:开头的 attr，就会把 node.hasBindings 设置为 true。

constdirRE=/^v-|^@|^:/if( dirRE. test(attr)) { //mark element as dynamicel. hasBindings=true}

并且元素节点不能有 if 和 for属性。

node.if 和 node.for 也是在解析器转换 AST 时设置的。

在解析的时候发现节点使用了 v-if，就会在解析的时候给当前节点设置一个 if 属性。

就是说元素节点不能使用 v-if v-for v-else 等指令。

并且元素节点不能是 slot 和 component。

并且元素节点不能是组件。

例如：

< List></ List>

不能是上面这样的自定义组件

并且元素节点的父级节点不能是带 v-for 的 template，查看详情 请狠狠的点击我。

并且元素节点上不能出现额外的属性。

额外的属性指的是不能出现 type

tag attrsList attrsMap plain parent children attrs staticClass staticStyle 这几个属性之外的其他属性，如果出现其他属性则认为当前节点不是静态节点。

只有符合上面所有条件的节点才会被认为是静态节点。

如何标记所有节点？

上面讲如何判断单个节点是否是静态节点，AST 是一棵树，我们如何把所有的节点都打上标记（static）呢？

还有一个问题是，判断 元素节点是不是静态节点不能光看它自身是不是静态节点，如果它的子节点不是静态节点，那就算它自身符合上面讲的静态节点的条件，它也不是静态节点。

所以在 vue 中有这样一行代码：

for( leti =0, l =node. children. length; i <l; i ++) { constchild=node. children[i] markStatic(child) if( !child. static) { node. static=false}}

markStatic 可以给节点标记，规则上面刚讲过，vue.js 通过循环 children 打标记，然后每个不同的子节点又会走相同的逻辑去循环它的 children 这样递归下来所有的节点都会被打上标记。

然后在循环中判断，如果某个子节点不是 静态节点，那么讲当前节点的标记改为 false。

这样一圈下来之后 AST 上的所有节点都被准确的打上了标记。

如何标记静态根节点？

标记静态根节点其实也是递归的过程。

vue 中的实现大概是这样的：

functionmarkStaticRoots( node:ASTNode, isInFor:boolean) { if( node. type===1) { //For a node to qualify as a static root, it should have children that//are not just static text. Otherwise the cost of hoisting out will//outweigh the benefits and it's better off to just always render it fresh.if( node. static&&node. children. length&&!( node. children. length===1&&node. children[ 0]. type===3)) { node. staticRoot=truereturn} else{ node. staticRoot=false} if( node. children) { for( leti =0, l =node. children. length; i <l; i ++) { markStaticRoots( node. children[i], isInFor ||!!node. for) } } }}

这段代码其实就一个意思：

当前节点是静态节点，并且有子节点，并且子节点不是单个静态文本节点这种情况会将当前节点标记为根静态节点。

额，，可能有点绕口，重新解释下。

上面我们标记 静态节点的时候有一段逻辑是只有所有 子节点都是 静态节点，当前节点才是真正的 静态节点。

所以这里我们如果发现一个节点是 静态节点，那就能证明它的所有 子节点也都是静态节点，而我们要标记的是 静态根节点，所以如果一个静态节点只包含了一个文本节点那就不会被标记为 静态根节点。

其实这么做也是为了性能考虑，vue 在注释中也说了，如果把一个只包含静态文本的节点标记为根节点，那么它的成本会超过收益~

总结一下

整体逻辑其实就是递归 AST 这颗树，然后将 静态节点和 静态根节点找到并打上标记。

代码生成器

代码生成器的作用是使用 element ASTs 生成 render 函数代码字符串。

使用本文开头举的例子中的模板生成后的 AST 来生成 render 后是这样的：

{ render :`with(this){return _c('div',[_c('p',[_v(_s(name))])])}`}

格式化后是这样的：

with( this){ return_c( 'div', [ _c( 'p', [ _v( _s(name)) ] ) ] )}

生成后的代码字符串中看到了有几个函数调用 _c，_v，_s。

_c 对应的是 ，它的作用是创建一个元素。

1. 第一个参数是一个HTML标签名
2. 第二个参数是元素上使用的属性所对应的数据对象，可选项
3. 第三个参数是 children

例如：

一个简单的模板：

< ptitle= "Berwin"@ click= "c">1</ p>

生成后的代码字符串是：

`with(this){return _c('p',{attrs:{"title":"Berwin"},on:{"click":c}},[_v("1")])}`

格式化后：

with( this){ return_c( 'p', { attrs :{ "title":"Berwin"}, on :{ "click":c} }, [ _v( "1")] )}

关于 想了解更多请狠狠的点击我。

_v 的意思是创建一个文本节点。

_s 是返回参数中的字符串。

代码生成器的总体逻辑其实就是使用 element ASTs 去递归，然后拼出这样的 _c('div',[_c('p',[_v(_s(name))])]) 字符串。

那如何拼这个字符串呢？？

请看下面的代码：

functiongenElement( el:ASTElement, state:CodegenState) { constdata=el. plain?undefined:genData(el, state) constchildren=el. inlineTemplate?null:genChildren(el, state, true) letcode =`_c('${el.tag}'${data ?`,${data}`:''//data}${children ?`,${children}`:''//children})`returncode}

因为 _c 的参数需要 tagName、data 和 children。

所以上面这段代码的主要逻辑就是用 genData 和 genChildren 获取 data 和 children，然后拼到 _c中去，拼完后把拼好的 "_c(tagName, data, children)" 返回。

所以我们现在比较关心的两个问题：

1. data 如何生成的（genData 的实现逻辑）？
2. children 如何生成的（genChildren 的实现逻辑）？

我们先看 genData 是怎样的实现逻辑：

functiongenData( el:ASTElement, state:CodegenState): string { letdata ='{'//keyif( el. key) { data +=`key:${el.key},`} //refif( el. ref) { data +=`ref:${el.ref},`} if( el. refInFor) { data +=`refInFor:true,`} //preif( el. pre) { data +=`pre:true,`} //... 类似的还有很多种情况data =data. replace( /,$/, '') +'}'returndata}

可以看到，就是根据 AST 上当前节点上都有什么属性，然后针对不同的属性做一些不同的处理，最后拼出一个字符串~

然后我们在看看 genChildren 是怎样的实现的：

functiongenChildren( el:ASTElement, state:CodegenState): string | void { constchildren=el. childrenif( children. length) { return`[${children.map(c=>genNode(c, state)).join(',')}]`}} functiongenNode( node:ASTNode, state:CodegenState): string { if( node. type===1) { returngenElement(node, state) } if( node. type===3&&node. isComment) { returngenComment(node) } else{ returngenText(node) }}

从上面代码中可以看出，生成 children 的过程其实就是循环 AST 中当前节点的 children，然后把每一项在重新按不同的节点类型去执行 genElement genComment genText。如果 genElement 中又有 children 在循环生成，如此反复递归，最后一圈跑完之后能拿到一个完整的 render 函数代码字符串，就是类似下面这个样子。

"_c('div',[_c('p',[_v(_s(name))])])"

最后把生成的 code 装到 with 里。

exportfunctiongenerate( ast:ASTElement|void, options:CompilerOptions): CodegenResult { conststate=newCodegenState(options) //如果ast为空，则创建一个空divconstcode=ast ?genElement(ast, state) :'_c("div")'return{ render :`with(this){return ${code}}`}}

关于代码生成器的部分到这里就说完了，其实源码中远不止这么简单，很多细节我都没有去说，我只说了一个大体的流程，对具体细节感兴趣的同学可以自己去看源码了解详情。

总结

本篇文章我们说了 vue 对模板编译的整体流程分为三个部分：解析器（parser），优化器（optimizer）和代码生成器（code generator）。

解析器（parser）的作用是将 模板字符串 转换成 element ASTs。

优化器（optimizer）的作用是找出那些静态节点和静态根节点并打上标记。

代码生成器（code generator）的作用是使用 element ASTs 生成 render函数代码（generate render function code from element ASTs）。

用一张图来表示：

![img](http://5b0988e595225.cdn.sohucs.com/images/20171224/db622eabb4e640ba8d3cc49b987b52e4.jpeg)

解析器（parser）的原理是一小段一小段的去截取字符串，然后维护一个 stack 用来保存DOM深度，每截取到一段标签的开始就 push 到 stack 中，当所有字符串都截取完之后也就解析出了一个完整的 AST。

优化器（optimizer）的原理是用递归的方式将所有节点打标记，表示是否是一个 静态节点，然后再次递归一遍把 静态根节点 也标记出来。

代码生成器（code generator）的原理也是通过递归去拼一个函数执行代码的字符串，递归的过程根据不同的节点类型调用不同的生成方法，如果发现是一颗元素节点就拼一个 _c(tagName, data, children) 的函数调用字符串，然后 data 和 children 也是使用 AST 中的属性去拼字符串。

如果 children 中还有 children 则递归去拼。

最后拼出一个完整的 render 函数代码。