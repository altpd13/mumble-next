const path = require('path')
const withSass = require('@zeit/next-sass')
const withWorkers = require('@zeit/next-workers')

module.exports = module.exports = withWorkers(
  withSass({
    ssModules: true,
    webpack(config, options) {
      config.module.rules.push({
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        // options: { inline: true }, // also works
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      });
      return config
    }
})
)