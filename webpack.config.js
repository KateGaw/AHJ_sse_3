const path = require('path'); // Node.js модуль для разрешения путей файлов
const HtmlWebpackPlugin = require('html-webpack-plugin'); // устанавливается через npm
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.bundle.js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: './index.html',
    }),
  ],
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
      },
    },
    {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader, 'css-loader',
      ],
    },

    {
      test: /\.html$/,
      use: [{
        loader: 'html-loader',
      }],
    },
    {
      test: /\.(png)$/,
      use: [{
        loader: 'file-loader',
        options: {
          esModule: false,
          name: '[name].[ext]',
        },
      }],
    },
    ],
  },
};
