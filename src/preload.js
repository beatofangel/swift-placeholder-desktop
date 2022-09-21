import { contextBridge, ipcRenderer } from 'electron'

const channels = {
  r2m: [
    'toMain',
    'directoryPicker',
    'filePicker',
    'notification',
    'openFile',
    'saveFile',
    'previewPdf',
    'getAppVersion',
  ],
  m2r: [
    'fromMain',
    'previewPdf',
    'readPlaceholderFromTemplate'
  ]
}
contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel, data) => {
    if (channels.r2m.includes(channel)) {
      return ipcRenderer.invoke(channel, data)
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  send: (channel, data) => {
    if (channels.r2m.includes(channel)) {
      ipcRenderer.send(channel, data)
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  receive: (channel, func) => {
    if (channels.m2r.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    } else {
      new Error(`invalid channel:${channel}`)
    }
  }
})

contextBridge.exposeInMainWorld('replaceService', { ...require('./service/replaceService') })
contextBridge.exposeInMainWorld('commonService', { ...require('./service/commonService') })