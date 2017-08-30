#初始化工程

现在让我们把这个文件夹转换成npm包：
npm init
你将看到有一些提示操作。 除了入口文件外，其余的都可以使用默认项。 入口文件使用./dist/main.js。 你可以随时在package.json文件里更改生成的配置。

#安装依赖项

现在我们可以使用npm install命令来安装包。 首先全局安装gulp-cli（如果你使用Unix系统，你可能需要在npm install命令上使用sudo）。
npm install -g gulp-cli
然后安装typescript，gulp和gulp-typescript到开发依赖项。 Gulp-typescript是TypeScript的一个Gulp插件。
npm install --save-dev typescript gulp gulp-typescript