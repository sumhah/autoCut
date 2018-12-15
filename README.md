# autoCut
Photoshop plugin for automatically generating HTML,CSS code

## 项目介绍
Photoshop插件，用来自动化生成HTML，CSS代码

## 进度
尚未完成，约50%

### 项目结构
./cepJs —— Photoshop浏览器环境的代码<br>
./js —— node.js处理source文件夹里的资源，最终生成html、css文件的代码<br>
./jsx —— Photoshop extentscript环境的代码，主要是es3版本的js，可以调用Photoshop底层的功能，采集图层信息，并生成source资源文件夹<br>
./source —— 采集后的Photoshop图层信息和图片资源<br>
./dist —— 最终生成的业务代码<br>
