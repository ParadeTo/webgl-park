const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  resolve: {
    extensions: ['.js', '.glsl'],
  },
  module: {
    rules: [
      {
        test: /\.(glsl|obj)$/,
        type: 'asset/source',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      scriptLoading: 'blocking',
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, '../'),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
      },
    },
    port: 8001,
  },
}
