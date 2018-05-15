const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        //all: './js/main.js',
        'distortion-slider': './projects/distortion-slider/js/main.js',
        'sphere-toggle': './projects/sphere-toggle/js/main.js'
    },
    output: {
        //path: path.resolve(__dirname, 'projects/[name]/js'),
        filename: './projects/[name]/js/main.min.js'
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
