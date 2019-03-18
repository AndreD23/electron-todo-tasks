const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .then(() => {
    console.log('done')
  })
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('../')
  const appPath = path.join(rootPath, 'app')
  const buildPath = path.join(rootPath, 'builds')
  const installerPath = path.join(rootPath, 'installers')

  return Promise.resolve({
    appDirectory: path.join(buildPath, require('./package.json').name +'-win32-x64/'),
    outputDirectory: path.join(installerPath, 'windows-installer'),
    exe: require('./package.json').name +'.exe',
    setupExe: require('./package.json').product +'Installer'+ require('./package.json').version +'.exe',
    authors: require('./package.json').author,
    title: require('./package.json').title,
    name: require('./package.json').product,
    description: require('./package.json').description,
    setupIcon: path.join(appPath, 'assets', 'icons', 'win', 'icon.ico')
  })
}