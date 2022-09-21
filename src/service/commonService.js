const {
  listBusinessCategoryAll,
  listTemplateByBusinessCategoryId,
  saveBusinessCategory,
  bulkSaveBusinessCategory,
  saveTemplate,
  savePlaceholder,
  findBusinessCategoryByPid,
} = require('./replaceService')

const listMethods = {
  listBusinessCategoryAll,
  listTemplateByBusinessCategoryId
}

const saveMethods = {
  saveTemplate,
  savePlaceholder,

  saveBusinessCategory,
  bulkSaveBusinessCategory,
}

const findMethods = {
  findBusinessCategoryByPid,
}

const { upperFirst } = require('lodash')

export async function find(modelName, conditions) {
  const methodName = `find${modelName}` + (conditions ? `By${Object.keys(conditions).map(upperFirst).join('And')}` : 'All')
  return await findMethods[methodName](conditions)
}

export async function bulkSave(modelName, ...items) {
  const methodName = `bulkSave${modelName}`
  return await saveMethods[methodName](items)
}

export async function save(modelName, item) {
  const methodName = `save${modelName}`
  return await saveMethods[methodName](item)
}

//-----------------------------------------------------------------------

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

// export function save(type, ...items) {
//   return saveMethods[`save${type}`](items)
// }