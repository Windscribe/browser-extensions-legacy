const module= {
    loaders: [
        {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader', // 'babel-loader' is also a legal name to reference
            query: {
                presets: ['es2015','react']
            }
        },
        {
            test: /\.json$/,
            loader: 'json-loader'
        },
        {
            test: /\.(jpg|png|gif)$/,
            loader: 'url-loader'
        },
        {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        },
        {
            test: /\.[ot]tf$/,
            loader: 'url-loader'
        }
    ]
}

export default {
    development: {
        devtool: "#source-map",
        module: module
    },
    production: {
        module: module
    }
};
