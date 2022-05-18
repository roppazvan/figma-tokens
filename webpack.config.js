const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

module.exports = (env, argv) => {
  // console.log(process.env);
  console.log(argv);
  console.log(env);
  return {
    mode: argv.mode === 'production' ? 'production' : 'development',

    // This is necessary because Figma's 'eval' works differently than normal eval
    devtool: argv.mode === 'production' ? false : 'inline-source-map',

    entry: {
      ui: './src/app/index.tsx', // The entry point for your UI code
      code: './src/plugin/controller.ts', // The entry point for your plugin code
      transform: './src/utils/transform.ts', // The entry point for your plugin code
    },

    module: {
      rules: [
        // Converts TypeScript code to JavaScript
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
            },
          ],
          exclude: /node_modules/,
        },

        // Enables including CSS by doing "import './file.css'" in your TypeScript code
        { test: /\.css$/, loader: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
        // Imports webfonts
        {
          test: /\.(woff|woff2)$/,
          use: {
            loader: 'url-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        },
        { test: /\.(png|jpg|gif|webp)$/, loader: [{ loader: 'url-loader' }] },
        {
          test: /\.svg$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                svgoConfig: {
                  plugins: [{ removeViewBox: false }],
                },
              },
            },
          ],
        },
        {
          type: 'javascript/auto',
          test: /\.mjs$/,
          include: /node_modules/,
        },
      ],
    },

    // Webpack tries these extensions for you if you omit the extension like "import './file'"
    resolve: {
      alias: {
        Types: path.resolve(__dirname, 'types'),
        '@types': path.resolve(__dirname, 'types'),
        '@': path.resolve(__dirname, 'src'),
        'react-redux': 'react-redux/dist/react-redux.js',
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
    },

    // Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
    plugins: [
      new Dotenv({
        path: argv.mode === 'production' ? '.env.production' : '.env',
      }),
      new webpack.DefinePlugin({
        'process.env': {
          PREVIEW_ENV: JSON.stringify(argv.env.PREVIEW_ENV),
        },
      }),
      new HtmlWebpackPlugin({
        template: './src/app/index.html',
        filename: 'index.html',
        inlineSource: '.(js)$',
        chunks: ['ui'],
      }),
      new HtmlWebpackInlineSourcePlugin(),
    ],

    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
        serveIndex: true,
      },
      // host: '0.0.0.0',
      // hot: true,
      port: 9000,
    },
  };
};
