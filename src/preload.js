import { contextBridge, ipcRenderer } from 'electron'

const channels = {
  r2m: [
    'toMain',
    'directoryPicker',
    'filePicker',
    'notification',
    'openFile',
    'saveFile',
    'deleteFile',
    'previewPdf',
    'getAppVersion',
    'minimize',
    'maximize',
    'close',
  ],
  m2r: [
    'fromMain',
    'previewPdf',
    'readPlaceholderFromTemplate'
  ]
}

const listeners = {}
contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel, data) => {
    if (channels.r2m.includes(channel)) {
      return ipcRenderer.invoke(channel, data)
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  send: (channel, data) => {
    if (!data.uid) new Error('ipcRenderer.send: uid is required!')
    if (channels.r2m.includes(channel)) {
      ipcRenderer.send(channel, data)
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  receive: (channel, func) => {
    if (channels.m2r.includes(channel.split('-')[0])) {
      listeners[channel] = (event, ...args) => func(...args)
      ipcRenderer.on(channel, listeners[channel])
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  removeListener: (channel) => {
    ipcRenderer.removeListener(channel, listeners[channel])
    delete listeners[channel]
  }
})

contextBridge.exposeInMainWorld('replaceService', { ...require('./service/replaceService') })
contextBridge.exposeInMainWorld('settingService', { ...require('./service/settingService') })
contextBridge.exposeInMainWorld('commonService', { ...require('./service/commonService') })
contextBridge.exposeInMainWorld('store', { ...require('./store') })