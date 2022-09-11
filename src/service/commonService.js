const {
  listBusinessCategoryAll,
  listTemplateByBusinessCategoryId,
  saveBusinessCategory,
  saveTemplate,
} = require('./replaceService')

const listMethods = {
  listBusinessCategoryAll,
  listTemplateByBusinessCategoryId
}

const saveMethods = {
  saveBusinessCategory,
  saveTemplate
}

export function list(type, condition) {
  if (condition) {
    const params = Object.values(condition)
    // const params = Object.entries(condition).map(([key, value]) => {
    //   const newObj = {}
    //   newObj[`@${key}`] = value
    //   return newObj
    // })
    const methodName = `list${type}By${Object.keys(condition).map(e => {
      return e.charAt(0).toUpperCase() + e.slice(1)
    }).join('And')}`
    return listMethods[methodName](...params)
  } else {
    return listMethods[`list${type}All`]()
  }
}

export function save(type, items) {
  return saveMethods[`save${type}`](items)
}