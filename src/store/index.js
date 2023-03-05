const Store = require('electron-store')

const store = new Store()
const sessionStore = new Store({ name: 'session'})

/* store.has("settings") ||  */// store.set("settings", {})

export function saveSetting(setting) {
  store.set(`settings.${setting.id}.name`, setting.name)
  store.set(`settings.${setting.id}.description`, setting.description)
  store.set(`settings.${setting.id}.type`, setting.type)
  store.set(`settings.${setting.id}.value`, setting.value)
  // store.getSetting("settings")[setting.id] = {
  //   name: setting.name,
  //   description: setting.description,
  //   type: setting.type,
  //   value: setting.value
  // }
}
export function initSettings(settings) {
  settings.forEach(setting => {
    store.set(`settings.${setting.id}.name`, setting.name)
    store.set(`settings.${setting.id}.description`, setting.description)
    store.set(`settings.${setting.id}.type`, setting.type)
    store.set(`settings.${setting.id}.value`, setting.value)
    // store.getSetting("settings")[setting.id] = {
    //   name: setting.name,
    //   description: setting.description,
    //   type: setting.type,
    //   value: setting.value
    // }
  })
}

export function saveSession(session) {
  const sessions = sessionStore.get(`sessions`)
  if (sessions) {
    const idx = sessions.findIndex(e=>e.id==session.id)
    if (idx != -1) {
      sessions[idx] = session
    } else {
      sessions.push(session)
    }
    sessionStore.set(`sessions`, sessions)
  } else {
    sessionStore.set(`sessions`, [session])
  }
}

export function loadSessions(type) {
  const sessions = sessionStore.get(`sessions`)
  return sessions ? (type ? sessions.filter(e=>e.type==type) : sessions) : []
}

export function deleteSession(sessionId) {
  const sessions = sessionStore.get(`sessions`)
  const idx = sessions.findIndex(e=>e.id==sessionId)
  if (idx != -1) {
    sessions.splice(idx, 1)
  }
  sessionStore.set(`sessions`, sessions)
}

export function clearSessions() {
  sessionStore.set(`sessions`, [])
}

// export function isAdminMode() {
//   return store.getSetting("settings.adminMode.value") == 1
// }

export function getSetting(key) {
  return store.get(key)
}

export function onDidChange(key, callback) {
  return store.onDidChange(key, (newValue) => callback(key, newValue))
}