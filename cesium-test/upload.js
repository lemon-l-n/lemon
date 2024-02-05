
const uploadPackage = require('./node_modules/hzt-project-base/src/serve/uploadPackage.js')
const childProcess = require('child_process')
const branchName = childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().replace(/\s+/, '')
const packageName = `${process.env.npm_package_name}-${process.env.VUE_APP_E}-${branchName}`

uploadPackage({
  packageName,
  folderName: 'other',
  processEnv: 'testEnv',
  defaultSettings: {
    systemName: 'cesium-test'
  },
  sendDDMessage: true
})
