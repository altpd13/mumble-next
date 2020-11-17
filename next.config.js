const path = require('path')
const withSass = require('@zeit/next-sass')

module.exports = withSass({
  ssModules: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
})