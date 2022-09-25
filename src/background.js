'use strict'

import { app, protocol, BrowserWindow, ipcMain, screen, dialog, Notification, shell, remote } from 'electron'
import fs, { readFileSync } from 'fs'
import Path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import _ from 'lodash'
import { exec } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import numeral from 'numeral'
import { sequelize } from './database/sequelize'

// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

// app.commandLine.appendSwitch('lang', 'zh_CN')
const calcWindowSize = () => {
  // const wLevels = [ 1024, 1280, 1920, 2560, 3840 ]
  // const hLevels = [ 768, 800, 1080, 1440, 2160 ]
  const screenSize = screen.getPrimaryDisplay().size
  // const width = (wLevels.find(w=>screenSize.width <= w) || screenSize.width) * 0.8
  // const height = (hLevels.find(h=>screenSize.height <= h) || screenSize.height) * 0.8
  const width = screenSize.width / 2
  const height = screenSize.height * 3 / 4
  return {
    width: width,
    height: height
  }
}
async function createWindow() {
  const screenSize = calcWindowSize()
  // Create the browser window.
  const win = new BrowserWindow({
    width: screenSize.width,
    height: screenSize.height,
    minWidth: screenSize.width,
    minHeight: screenSize.height,
    webPreferences: {
      preload: Path.join(__dirname, 'preload.js'),
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools({ mode: 'undocked' })
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      /****************** 加载本地vue-devTools **************/
      const { session } = require("electron");
      session.defaultSession.loadExtension(
        Path.resolve(__dirname, "../../vue-devtools/packages/shell-chrome")
      ); 
      /*****************************************************/
      /************************ 注释此行 ********************/
      // await installExtension(VUEJS_DEVTOOLS)
      /*****************************************************/
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  await sequelize.sync({
    alter: process.env.NODE_ENV !== 'production' && {
      drop: false
    }
  })

  // console.log(__dirname)
  // const tar = require('tar')
  // const child_process = require('child_process')
  // if (!existsSync(Path.join(__dirname, 'instdir'))) {
  //   await tar.extract({
  //     file: Path.join(__dirname, '/../extraResources/lo.tar.gz'),
  //     C: Path.join(__dirname)
  //   })
  // }

  // unlinkSync(Path.resolve(__dirname, 'extraResources/lo.tar.gz'))

  // const extOutput = 'doc'
  // const outputDir = app.getPath("downloads")
  // const pathFile = 'C:/Users/EricW/Desktop/xxxxxxx.doc'
  // const convertCommandWindows = `${Path.resolve(__dirname, 'instdir', 'program', 'soffice.bin')} --headless --norestore --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --convert-to ${extOutput} --outdir ${outputDir} "${pathFile}"`;
  // try {
    // child_process.execSync(convertCommandWindows).toString('utf8')
  // } catch (error) {
  //   console.log(error.toString())
  // }
  
  app.setAppUserModelId(process.execPath)

  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

const homedir = Path.join(app.getPath("documents"), _.camelCase(app.name))
fs.existsSync(homedir) || fs.mkdir(homedir, err=>{
  if (err) {
    console.log(`cannot create app home directory: ${err}`)
  } else {
    const subdirs = ['template']
    subdirs.forEach(subdir=>fs.mkdir(Path.join(homedir, subdir), err=>{
      if (err) {
        console.log(`cannot create directory: ${err}`)
      }
    }))
  }
})


// ipcMain.handle('toMain', async (event, data) => {
//   console.log(data)
//   event.sender.send('fromMain', 'hello from main')
//   return 'yes'
// })

ipcMain.handle('directoryPicker', async (event, data) => {
  // const os = require ("os");
  // const userHomeDir = os.homedir ()
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: `选择${data.title}`,
    defaultPath: data.directory || app.getPath("documents"),
    properties: [
      'openDirectory'
    ]
  })

  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('filePicker', async (event, data) => {
  // const os = require ("os");
  // const userHomeDir = os.homedir ()
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: `选择${data.title}`,
    defaultPath: data.directory || app.getPath("documents"),
    properties: [
      'openFile'
    ],
    filters: [
      { name: 'Word文档', extensions: [ 'doc', 'docx' ] }
    ]
  })

  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('getAppVersion', async (event) => {
  return app.getVersion()
})

ipcMain.on('notification', (event, options) => {
  if (!options) return
  const notification = new Notification(options)
  notification.show()
})

ipcMain.handle('openFile', async (event, filePath) => {
  return await shell.openPath(filePath)
})

ipcMain.handle('saveFile', async (event, { srcPath, folder, type }) => {
  const parsedPath = Path.parse(srcPath)
  const destPath = Path.join(homedir, type, folder)
  fs.existsSync(destPath) || fs.mkdirSync(destPath)
  const destFile = Path.join(destPath, `${uuidv4()}${parsedPath.ext}`)
  fs.copyFileSync(srcPath, destFile)
  
  return {
    path: destFile
  }
})

ipcMain.handle('deleteFile', async (event, { path }) => {
  fs.existsSync(path) && fs.rmSync(path)
  return true
})

// ipcMain.on('previewPdf', async (event, { id, path: tplPath }) => {
  
//   const extOutput = 'pdf'
//   const outputDir = app.getPath('temp')
//   const pathFile = tplPath
//   const soffice = Path.resolve("C:/Users/EricW/Documents/WORKSPACE/VSCODE/swift-placeholder-desktop", 'instdir', 'program', 'soffice.exe')
//   const convertCommandWindows = `${soffice} --headless --norestore --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --convert-to ${extOutput} --outdir ${outputDir} "${pathFile}"`;
//   try {
//     exec(convertCommandWindows, (error, stdout, stderr) => {
//       if (error) {
//         console.log(error.toString())
//       } else {
//         const oriPdf = Path.join(outputDir, `${Path.parse(tplPath).name}.${extOutput}`)
//         // const tmpPdf = Path.join(outputDir, `${uuidv4()}.${extOutput}`)
//         const tmpPdf = Path.join(outputDir, `${id}.${extOutput}`)
//         fs.renameSync(oriPdf, tmpPdf)
//         event.sender.send('previewPdf', { id: id, path: tmpPdf })
//       }
//     })
//     // execSync(convertCommandWindows).toString('utf8')
//     // return await shell.openPath(tmpPdf)
//   } catch (error) {
//     console.log(error.toString())
//   }
// })

function previewPdfCmd(outputDir, pathFile) {
  const soffice = Path.resolve("C:/Users/EricW/Documents/WORKSPACE/VSCODE/swift-placeholder-desktop", 'instdir', 'program', 'soffice.exe')
  return `${soffice} --headless --norestore --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --convert-to pdf --outdir ${outputDir} "${pathFile}"`;
}

function doReplaceCmd(sourceDoc, outputDoc, args) {
  const replaceApp = Path.resolve("C:/Users/EricW/Documents/WORKSPACE/VSCODE/swift-placeholder-desktop", "replaceApp", "replaceApp.exe")
  return `${replaceApp} -s "${sourceDoc}" -o "${outputDoc}" ${args}`
}

function formatReplacement({ value, type, format }) {
  let result = value
  if (value && format) {
    switch (type) {
      case 'date':
        result = moment(value).format(format)
        break
      case 'number':
        // TODO
        result = numeral(value).format(format)
        break
    }
  }

  return result
}

ipcMain.on('previewPdf', async (event, { id, path: tplPath, data }) => {
  const outputDir = app.getPath('temp')
  const sourceDoc = tplPath
  const tempUuid = uuidv4()
  const outputDoc = Path.join(outputDir, `${tempUuid}.docx`)
  const args = data.map(e=>{
    return `-p "${e.name}" -r "${formatReplacement(e)}"`
  }).join(" ")
  const replaceCommandWindows = doReplaceCmd(sourceDoc, outputDoc, args)
  try {
    exec(replaceCommandWindows, (error, stdout, stderr) => {
      if (error) {
        console.log(error.toString())
      } else {
        const placeholders = stdout ? stdout.split('\n') : []
        // console.log(stdout)
        event.sender.send('readPlaceholderFromTemplate', { id: id, ph: placeholders })
        const inputDoc = outputDoc
        const convertCommandWindows = previewPdfCmd(outputDir, inputDoc)
        try {
          exec(convertCommandWindows, (error, stdout, stderr) => {
            if (error) {
              console.log(error.toString())
            } else {
              const oriPdf = Path.join(outputDir, `${tempUuid}.pdf`)
              event.sender.send('previewPdf', { id: id, path: oriPdf })
              // const outputPdf = Path.join(outputDir, `${id}.pdf`)
              // fs.renameSync(oriPdf, outputPdf)
              // event.sender.send('fromMain', { id: id, data: buffer })
            }
          })
        } catch (error) {
          console.log(error.toString())
        }
      }
    })
  } catch (error) {
    console.log(error.toString())
  }
})
