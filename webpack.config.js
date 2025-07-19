const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: {
    InstagramScraper: './nodes/InstagramScraper/InstagramScraper.node.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].node.js',
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
