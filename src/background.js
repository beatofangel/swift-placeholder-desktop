'use strict'

import { app, protocol, BrowserWindow, ipcMain, screen, dialog, Notification, shell } from 'electron'
import { existsSync, mkdir, unlinkSync } from 'fs'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import _ from 'lodash'
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
  const height = screenSize.height * 2 / 3
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
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
        path.resolve(__dirname, "../../vue-devtools/packages/shell-chrome")
      ); 
      /*****************************************************/
      /************************ 注释此行 ********************/
      // await installExtension(VUEJS_DEVTOOLS)
      /*****************************************************/
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  // console.log(__dirname)
  // const tar = require('tar')
  // const child_process = require('child_process')
  // if (!existsSync(path.join(__dirname, 'instdir'))) {
  //   await tar.extract({
  //     file: path.join(__dirname, '/../extraResources/lo.tar.gz'),
  //     C: path.join(__dirname)
  //   })
  // }

  // unlinkSync(path.resolve(__dirname, 'extraResources/lo.tar.gz'))

  // const extOutput = 'doc'
  // const outputDir = app.getPath("downloads")
  // const pathFile = 'C:/Users/EricW/Desktop/文本替换工具V4/向法院提交材料清单（曾丽蓉）.doc'
  // const convertCommandWindows = `${path.resolve(__dirname, 'instdir', 'program', 'soffice.bin')} --headless --norestore --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --convert-to ${extOutput} --outdir ${outputDir} "${pathFile}"`;
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

const homedir = path.join(app.getPath("documents"), _.camelCase(app.name))
existsSync(homedir) || mkdir(homedir, err=>{
  if (err) {
    console.log(`cannot create app home directory: ${err}`)
  } else {
    const subdirs = ['template']
    subdirs.forEach(subdir=>mkdir(path.join(homedir, subdir), err=>{
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

ipcMain.handle('notification', (event, options) => {
  if (!options) return
  const notification = new Notification(options)
  notification.show()
})

ipcMain.handle('openFile', async (event, filePath) => {
  return await shell.openPath(filePath)
})