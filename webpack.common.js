const webpack = require('webpack');
const path = require('path');
const OnlyIfChangedPlugin = require('only-if-changed-webpack-plugin');

let opts = {
    rootDir: process.cwd(),
    devBuild: process.env.NODE_ENV !== 'production',
};

module.exports = {
    entry: {
        //all: './js/main.js',
        'distortion-slider': './projects/distortion-slider/js/main.js',
        //'sphere-toggle': './projects/sphere-toggle/js/main.js',
        'lost': './projects/lost/js/main.js',
        'cabin': './projects/cabin/js/main.js',
    },
    output: {
        path: path.join(opts.rootDir, 'projects'),
        pathinfo: opts.devBuild,
        filename: '[name]/js/main.min.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015'],
                            plugins: [require('babel-plugin-transform-remove-strict-mode')]
                        }
                    },
                    {
                        loader: 'eslint-loader',
                        options: {
                            configFile: path.resolve(__dirname, '.eslintrc'),
                            failOnWarning: false,
                            failOnError: true
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new OnlyIfChangedPlugin({
            cacheDirectory: path.join(opts.rootDir, 'tmp/cache'),
            cacheIdentifier: opts, // all variable opts/environment should be used in cache key
        })
    ],
};
