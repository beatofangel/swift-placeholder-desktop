const Store = require('electron-store')

const store = new Store()

/* store.has("settings") ||  */// store.set("settings", {})

export function saveSetting(setting) {
  store.set(`settings.${setting.id}.name`, setting.name)
  store.set(`settings.${setting.id}.description`, setting.description)
  store.set(`settings.${setting.id}.type`, setting.type)
  store.set(`settings.${setting.id}.value`, setting.value)
  // store.get("settings")[setting.id] = {
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
    // store.get("settings")[setting.id] = {
    //   name: setting.name,
    //   description: setting.description,
    //   type: setting.type,
    //   value: setting.value
    // }
  })
}

// export function isAdminMode() {
//   return store.get("settings.adminMode.value") == 1
// }

export function get(key) {
  return store.get(key)
}

export function onDidChange(key, callback) {
  return store.onDidChange(key, (newValue) => callback(key, newValue))
}