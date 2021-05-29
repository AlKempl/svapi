const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: {
        js: ["@babel/polyfill", "./src/js/index.js"]
    },
    output: {
        filename: "script.js",
        path: path.resolve(__dirname, "assets"),
        publicPath: "/"
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "style.css"
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /bootstrap[\S.]*\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader" // translates CSS into CommonJS
                ]
            },
            {
                test: /\.[s]*css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader"
                ]
            }
        ]
    },
};
