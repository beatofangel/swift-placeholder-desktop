import { contextBridge, ipcRenderer } from 'electron'

const channels = {
  r2m: [
    'toMain',
    'directoryPicker',
    'filePicker',
    'notification',
    'openFile'
  ],
  m2r: [
    'fromMain'
  ]
}
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    return new Promise((resolve, reject) => {
      if (channels.r2m.includes(channel)) {
        ipcRenderer.invoke(channel, data).then(resolve).catch(reject)
        // resolve(ipcRenderer.invoke(channel, data))
      } else {
        reject(`invalid channel:${channel}`)
      }
    })
  },
  receive: (channel, func) => {
    return new Promise((resolve, reject) => {
      if (channels.m2r.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => resolve(...args))
      } else {
        reject(`invalid channel:${channel}`)
      }
    })
  },
})

contextBridge.exposeInMainWorld('replaceService', { ...require('./service/replaceService') })