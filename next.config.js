const path = require('path')
const withSass = require('@zeit/next-sass')

module.exports = withSass({
  cssModule:true,
  webpack(config, options) {
    config.module.rules.push({
      test: /\.worker\.js$/,
      loader: 'worker-loader',
      // options: { inline: true }, // also works
      options: {
        // inline: true,
        name: 'static/[hash].worker.js',
        publicPath: '/_next/',
      },
    });
    return config
  }
})
