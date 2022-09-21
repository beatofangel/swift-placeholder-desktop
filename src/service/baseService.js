const { openDb, Models } = require('../database/userdata')
const _ = require('lodash')

export async function get(sql, params, func) {
  return openDb().then(db => {
    return db.get(sql, params).then(func).finally(() => {
      db.close()
    })
  })
}

export async function list(sql, params, func) {
  let _func
  let _params
  if (func) {
    _func = func
    _params = params
  } else {
    if (typeof params == 'function') {
      _func = params
    } else {
      new Error('invalid argument')
    }
  }
  return openDb().then(db => {
    return db.all(sql, _params).then(_func).finally(() => {
      db.close()
    })
  })
}

export async function runInternal(func) {
  return openDb().then(async db => {
    let result
    try {
      await db.run('BEGIN TRANSACTION')
      const rst = await func(db)
      console.log(rst)
      await db.run('COMMIT TRANSACTION')
      result = {
        success: true
      }
    } catch (error) {
      console.error(error)
      await db.run('ROLLBACK TRANSACTION')
      result = {
        success: false,
        error: error
      }
    }
    return result
  }).catch(error => {
    return {
      success: false,
      error: error
    }
  })
}

export function getModel(modelName) {
  const model = Models[`${modelName}Model`]
  if (!model) throw `Model with name ${modelName} not found.`
  return model
}
