const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './index.ts', // Apunta a index.ts
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js', // El archivo de salida principal será index.js
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
          },
        },
      },
    ],
  },
  externals: {
    'n8n-workflow': 'n8n-workflow',
    'n8n-core': 'n8n-core',
  },
};