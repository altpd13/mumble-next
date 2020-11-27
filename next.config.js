const path = require('path')
const withSass = require('@zeit/next-sass')
const withWorkers = require('@zeit/next-workers')

// module.exports = withWorkers(
//   withSass({
//     cssModules: true,
//     webpack(config, options) {
//       config.module.rules.push({
//         test: /\.worker\.js$/,
//         loader: 'worker-loader',
//         options: {
//           filename: 'static/[hash].worker.js',
//           publicPath: '/_next/',
//         },
//       })
//       return config
//     }
//   })
// )

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

// module.exports = withSass(
//   withWorkers({
//     cssModule: true,
//     webpack(config, options) {
//       config.module.rules.push({
//         test: /\.worker\.js$/,
//         loader: 'worker-loader',
//         options: {
//           name: 'static/[hash].worker.js',
//           publicPath: '/_next/',
//         },
//       })
//       return config
//     }
//   })
// )

