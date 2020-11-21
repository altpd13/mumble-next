const path = require('path')
const withSass = require('@zeit/next-sass')
const withWorkers = require('@zeit/next-workers')

module.exports = module.exports = withWorkers(
  withSass({
    ssModules: true,
    /*sassOptions: {
      includePaths: [path.join(__dirname, 'styles')],
    },*/
  // workerLoaderOptions: { inline: true },
  // webpack(config, {isServer}) {
  //   config.resolve = {
  //     alias: {
  //       'webworkify$': 'webworkify-webpack'
  //     },
  //     ...config.resolve
  //   }
  //   return config
  // }
})
)