var webpack = require('webpack');

module.exports = {
    target: 'electron-main',
    devtool: 'source-map',//配置生成Source Maps，选择合适的选项
    entry: __dirname + "/cepJs/main.js",//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/cepJs",//打包后的文件存放的地方
        filename: "bundle.js"//打包后输出文件的文件名
    },
    module: {//在配置文件里添加JSON loader
        loaders: [
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',//在webpack的module部分的loaders里进行配置即可
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader?modules'//添加对样式表的处理
            },
            {
                test: /\.scss$/,
                loader: 'style-loader!css-loader?modules!sass-loader'//添加对样式表的处理
            }
        ]
    },
    devServer: {
        contentBase: "./public",//本地服务器所加载的页面所在的目录
        historyApiFallback: true,//不跳转
        inline: true//实时刷新
    },
    watch: true, // boolean
    // 启用观察
    watchOptions: {
        aggregateTimeout: 1000, // in ms
        // 将多个更改聚合到单个重构建(rebuild)
        poll: 500, // 间隔单位 ms
        // 启用轮询观察模式
        // 必须用在不通知更改的文件系统中
        // 即 nfs shares（译者注：Network FileSystem，最大的功能就是可以透過網路，讓不同的機器、不同的作業系統、可以彼此分享個別的檔案 ( share file )）
    },
};