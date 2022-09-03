const { openDb } = require('../database/userdata')
const { getBusinessCategoriesSql, saveBusinessCategoriesSql, deleteBusinessCategoriesSql, getPlaceholdersSql, getTemplateSql } = require('../database/sql/sql.json')

export function getBusinessCategories() {
  return list(getBusinessCategoriesSql, result => result.map(e => {
      return {
        id: e.ID,
        name: e.NAME,
        icon: e.ICON || '',
        sort: e.SORT
      }
    })
  )
}

export function getBusinessCategoryOptions() {
  return list(getBusinessCategoriesSql, result => result.map(e => {
      return {
        value: e.ID,
        text: e.NAME,
        icon: e.ICON || '',
        index: e.SORT
      }
    })
  )
}

export function getPlaceholders(businessCategoryId) {
  return list(getPlaceholdersSql, {
      '@businessCategoryId': businessCategoryId
    }, result => result.map(e => {
      return {
        group: e.PGNAME,
        name: e.PHNAME,
        count: 0,
        value: ''
      }
    })
  )
}

export function getTemplate(businessCategoryId) {
  return get(getTemplateSql, {
      '@businessCategoryId': businessCategoryId
    }, result => {
      return result && {
        name: result.NAME,
        path: result.PATH
      }
    }
  )
}

export async function saveBusinessCategories(items) {
  return await runInternal(db => {
    items.forEach(async item => {
      if (item.delete) {
        console.log(item)
        const rst = await db.run(deleteBusinessCategoriesSql, {
          '@id': item.id
        })
        console.log(rst)
      } else {
        console.log(item)
        const rst = await db.run(saveBusinessCategoriesSql, {
          '@id': item.id,
          '@name': item.name,
          '@icon': item.icon,
          '@sort': item.sort
        })
        console.log(rst)
      }
    })
  })
}

async function get(sql, params, func) {
  return openDb().then(db => {
    return db.get(sql, params).then(func).finally(() => {
      db.close()
    })
  })
}

async function list(sql, params, func) {
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

async function runInternal(func) {
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
