const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './js/main.js',
    output: {
        path: path.resolve(__dirname, 'js'),
        filename: 'main.min.js'
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
    }
};
