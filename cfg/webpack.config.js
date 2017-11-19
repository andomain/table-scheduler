import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

module.exports = {
    devtool: 'source-map',
    entry: "./src/js/init",
    output: {
        filename: "app.bundle.js"
    },
    devtool: 'eval',
    module: {
    	loaders: [
    		{ 
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: '/node-modules/'
            }
    	]
    },
    plugins: [
        new UglifyJsPlugin()
    ]
}