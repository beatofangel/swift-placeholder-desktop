'use strict'

import { app, protocol, BrowserWindow, ipcMain, screen, dialog, Notification, shell, remote } from 'electron'
import fs from 'fs'
import fsPromises from 'fs/promises'
import Path, { sep } from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import _ from 'lodash'
import { exec, execFile, spawnSync } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import numeral from 'numeral'
import { sequelize } from './database/sequelize'
import { getSetting, initSettings, saveSetting } from './store'
import { findSettingAll } from './service/settingService'
import log from 'electron-log'

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
    frame: false,
    webPreferences: {
      preload: Path.join(__dirname, 'preload.js'),
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      // webSecurity: false
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

  // Prevent Page refresh
  // win.webContents.on('before-input-event', (event, input) => {
  //   if (input.control && input.key.toUpperCase() === 'R') { // Ctrl+R
  //     event.preventDefault()
  //   }
  // })
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
      log.error('Vue Devtools failed to install:', e.toString())
    }
  }

  await sequelize.sync({
    alter: process.env.NODE_ENV !== 'production' && {
      drop: false
    }
  })

  // 初始化设置
  const settings = await findSettingAll()
  initSettings(settings)
  const outputDirectory = getSetting("settings.outputDirectory").value
  if (!outputDirectory) {
    saveSetting({
      id: 'outputDirectory',
      name: '输出目录',
      description: '替换以后的文档保存在这里',
      type: 'PATH',
      value: Path.join(homedir, 'output')
    })
  }

  // log.debug(__dirname)
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
  //   log.debug(error.toString())
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
if (!fs.existsSync(homedir)) {
  fs.mkdirSync(homedir)
}
const subdirs = ['template', 'output']
subdirs.forEach(subdir=>{
  const subPath = Path.join(homedir, subdir)
  fs.existsSync(subPath) || fs.mkdir(subPath, err=>{
    if (err) {
      log.error(`cannot create directory: ${err}`)
    }
  })
})

// fs.existsSync(homedir) || fs.mkdir(homedir, err=>{
//   if (err) {
//     log.debug(`cannot create app home directory: ${err}`)
//   } else {
//     const subdirs = ['template', 'output']
//     subdirs.forEach(subdir=>fs.mkdir(Path.join(homedir, subdir), err=>{
//       if (err) {
//         log.debug(`cannot create directory: ${err}`)
//       }
//     }))
//   }
// })

// TODO 暂不支持多窗口
ipcMain.handle('minimize', async () => {
  const win = BrowserWindow.getFocusedWindow()
  win.minimize()
})

ipcMain.handle('maximize', async () => {
  const win = BrowserWindow.getFocusedWindow()
  const maximized = win.isMaximized()
  maximized ? win.unmaximize() : win.maximize()
  return !maximized
})

ipcMain.handle('close', async event => {
  const win = BrowserWindow.getFocusedWindow()
  event.sender.isDevToolsOpened && event.sender.closeDevTools()
  win.close()
  // win.destroy()
})

// ipcMain.handle('toMain', async (event, data) => {
//   log.debug(data)
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

ipcMain.handle('deleteFile', async (event, { filePath }) => {
  if (fs.existsSync(filePath)) {
    return fsPromises.rm(filePath)
  }
})

ipcMain.handle('createSession', async (event, { id: sessionId }) => {
  const sessionFolder = getSessionPath(sessionId)
  if (!fs.existsSync(sessionFolder)) {
    return fs.mkdirSync(sessionFolder, { recursive: true })
  }
  // return fs.mkdtempSync(`${sessionFolder}${sep}`)
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
//         log.debug(error.toString())
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
//     log.debug(error.toString())
//   }
// })

function previewPdfCmd(outputDir, pathFile) {
  const soffice = Path.resolve("C:/Users/EricW/Documents/WORKSPACE/VSCODE/swift-placeholder-desktop", 'instdir', 'program', 'soffice.exe')
  // return `${soffice} --headless --norestore --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --convert-to pdf --outdir ${outputDir} "${pathFile}"`;
  return {
    convertCmd: soffice,
    convertArgs: [
      '--headless',
      '--norestore',
      '--invisible',
      '--nodefault',
      '--nofirststartwizard',
      '--nolockcheck',
      '--nologo',
      '--convert-to',
      'pdf',
      '--outdir',
      outputDir,
      pathFile
    ]
  }
}

function doReplaceCmd(sourceDoc, outputDoc, args) {
  const replaceApp = Path.resolve("C:/Users/EricW/Documents/WORKSPACE/VSCODE/swift-placeholder-desktop", "replaceApp", "replaceApp.exe")
  // return `${replaceApp} -s "${sourceDoc}" -o "${outputDoc}" ${args}`
  return {
    replaceCmd: replaceApp, 
    replaceArgs: ['-s', sourceDoc, '-o', outputDoc, ...args]
  }
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

function getSessionPath(sessionId) {
  return Path.resolve(app.getPath('temp'), app.getName(), 'session', sessionId)
}

function getOutputPath(name, parentFolder = "") {
  const path = Path.join(getSetting("settings.outputDirectory").value, parentFolder, name)
  fs.existsSync(path) || fs.mkdirSync(path, { recursive: true })
  return path
}

import async from 'async'
const q = async.queue(function(task, callback) {
  const processPdf = task.isPreview ? doPreviewPdf : doReplacePdf
  processPdf(task.event, task.args, callback)
})
q.drain(function() {
  log.debug("处理完毕");
});
q.error(function(err, task) {
  log.error(err, task);
});

function doReplacePdf(event, { path: tplPath, name, filename, data, parentFolder }, callback) {
  const parentDir = getOutputPath(parentFolder)
  const outputDir = getOutputPath(name, parentFolder)
  const sourceDoc = tplPath
  const outputDoc = Path.join(outputDir, `${filename}.docx`)
  const args = []
  data.forEach(e => {
    if (e.value !== "") {
      args.push('-p')
      args.push(e.name)
      args.push('-r')
      args.push(formatReplacement(e))
    }
  })
  const { replaceCmd, replaceArgs } = doReplaceCmd(sourceDoc, outputDoc, args)
  try {
    execFile(replaceCmd, replaceArgs, (error, stdout, stderr) => {
      if (error) {
        log.error(error)
        return
      }
      // const placeholders = stdout.split('\n')
      // log.debug(placeholders)
      // event.sender.send(`readPlaceholderFromTemplate-${uid}`, { id: id, ph: placeholders })
      const inputDoc = outputDoc
      const { convertCmd, convertArgs } = previewPdfCmd(outputDir, inputDoc)
      execFile(convertCmd, convertArgs, (error, stdout, stderr) => {
        if (error) {
          log.error(error)
          return
        }
        event.sender.send(`replacePdf`, {
          output: parentDir
        })
        callback()
      })
    })
    
  } catch (error) {
    log.error(error.toString())
  }
}

function doPreviewPdf(event, { uid, sessionId, id, path: tplPath, data }, callback) {
  const outputDir = getSessionPath(sessionId)
  const sourceDoc = tplPath
  const tempUuid = uuidv4()
  const outputDoc = Path.join(outputDir, `${tempUuid}.docx`)
  const args = []
  data.forEach(e => {
    if (e.value !== "") {
      args.push('-p')
      args.push(e.name)
      args.push('-r')
      args.push(formatReplacement(e))
    }
  })
  const { replaceCmd, replaceArgs } = doReplaceCmd(sourceDoc, outputDoc, args)
  try {
    execFile(replaceCmd, replaceArgs, (error, stdout, stderr) => {
      if (error) {
        log.error(error)
        return
      }
      const placeholders = stdout.split('\n')
      log.debug(placeholders)
      event.sender.send(`readPlaceholderFromTemplate-${uid}`, { id: id, ph: placeholders })
      const inputDoc = outputDoc
      const { convertCmd, convertArgs } = previewPdfCmd(outputDir, inputDoc)
      execFile(convertCmd, convertArgs, (error, stdout, stderr) => {
        if (error) {
          log.error(error)
          return
        }
        const oriPdf = Path.join(outputDir, `${tempUuid}.pdf`)
        const buffer = fs.readFileSync(oriPdf)
        event.sender.send(`previewPdf-${uid}`, { id: id, path: oriPdf, data: buffer })
        callback()
      })
    })
    
  } catch (error) {
    log.error(error.toString())
  }
}

ipcMain.on('previewPdf', (event, args) => {
  q.push({ event, args, isPreview: true })
})

ipcMain.on('replacePdf', (event, args) => {
  const parentFolder = moment().format('YYYYMMDDHHmmss')
  for (const argv of args) {
    argv.parentFolder = parentFolder
    q.push({ event, args: argv, isPreview: false })
  }
})

process.on('unhandledRejection', error => {
  log.error(error)
})