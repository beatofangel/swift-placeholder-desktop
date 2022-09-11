const SQL = require('../database/sql/sql.json')
const { get, list, runInternal } = require('./baseService')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')

export function listBusinessCategoryAll() {
  return list(SQL.listBusinessCategoryAllSql, result => result.map(e => {
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
  return list(SQL.listBusinessCategoryAllSql, result => result.map(e => {
    return {
      value: e.ID,
      text: e.NAME,
      icon: e.ICON || '',
      index: e.SORT
    }
  })
  )
}

export function listPlaceholderByTemplateId(templateId) {
  return list(SQL.listPlaceholderByTemplateIdSql, {
    '@templateId': templateId
  }, result => result.map(e => {
    return {
      groupId: e.PGID,
      group: e.PGNAME,
      id: e.PHID,
      name: e.PHNAME,
      type: e.PHTYPE,
      format: e.PHFORMAT,
      count: 0,
      value: ''
    }
  })
  )
}

export function listPlaceholderGroupByTemplateId(templateId) {
  return list(SQL.listPlaceholderGroupByTemplateIdSql, {
    '@templateId': templateId
  }, result => result.map(e => {
    return {
      id: e.ID,
      name: e.NAME,
      value: null
    }
  })
  )
}

export function listTemplateByBusinessCategoryId(businessCategoryId) {
  return list(SQL.listTemplateByBusinessCategoryIdSql, {
    '@businessCategoryId': businessCategoryId
  }, result => result.map(e => {
    return {
      id: e.ID,
      name: e.NAME,
      path: e.PATH
    }
  })
  )
}

export async function saveBusinessCategory(items) {
  return await runInternal(db => {
    items.forEach(async item => {
      if (item.delete) {
        console.log(item)
        const rst = await db.run(SQL.deleteBusinessCategoriesSql, {
          '@id': item.id
        })
        console.log(rst)
      } else {
        console.log(item)
        const rst = await db.run(SQL.saveBusinessCategorySql, {
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

export async function saveTemplate(item) {
  return await runInternal(async db=>{
    if (item.insert) {
      const rst1 = await db.run(SQL.saveTemplateSql, {
        '@id': item.id,
        '@name': item.name,
        '@path': item.path,
        '@lastchange': moment().format("YYYY-MM-DD HH:mm:ss")
      })
      console.log('TEMPLATE inserted.')
      const rst2 = await db.run(SQL.insertBcTplRelSql, {
        '@id': uuidv4(),
        '@bcid': item.bcid,
        '@tplid': item.id
      })
      console.log('BC_TPL_REL inserted.')
    } else if (item.delete) {
      const rst1 = await db.run(SQL.deleteBcTplRelByTemplateIdSql, {
        '@templateId': item.id
      })
      console.log('BC_TPL_REL deleted.')
      const rst2 = await db.run(SQL.deleteTplPhgrpRelByTemplateIdSql, {
        '@templateId': item.id
      })
      console.log('TPL_PHGRP_REL deleted.')
      const rst3 = await db.run(SQL.deleteTemplateSql, {
        '@id': item.id
      })
      console.log('TEMPLATE deleted.')
    } else {
      // default: update
      const rst = await db.run(SQL.saveTemplateSql, {
        '@id': item.id,
        '@name': item.name,
        '@path': item.path,
        '@lastchange': moment().format("YYYY-MM-DD HH:mm:ss")
      })
      console.log('TEMPLATE updated.')
    }
  })
}

export async function insertTemplate(item) {
  return await runInternal(async db => {
    const rst = await db.run(SQL.insertTemplateSql, {
      '@id': item.id,
      '@name': item.name,
      '@path': item.path,
      '@lastchange': moment().format("YYYY-MM-DD HH:mm:ss")
    })
    console.log(rst)
  })
}

export async function updateTemplate(item) {
  return await runInternal(async db => {
    const rst = await db.run(SQL.updateTemplateSql, {
      '@id': item.id,
      '@name': item.name,
      '@path': item.path,
      '@lastchange': moment().format("YYYY-MM-DD HH:mm:ss")
    })
    console.log(rst)
  })
}

// async function get(sql, params, func) {
//   return openDb().then(db => {
//     return db.get(sql, params).then(func).finally(() => {
//       db.close()
//     })
//   })
// }

// async function list(sql, params, func) {
//   let _func
//   let _params
//   if (func) {
//     _func = func
//     _params = params
//   } else {
//     if (typeof params == 'function') {
//       _func = params
//     } else {
//       new Error('invalid argument')
//     }
//   }
//   return openDb().then(db => {
//     return db.all(sql, _params).then(_func).finally(() => {
//       db.close()
//     })
//   })
// }

// async function runInternal(func) {
//   return openDb().then(async db => {
//     let result
//     try {
//       await db.run('BEGIN TRANSACTION')
//       const rst = await func(db)
//       console.log(rst)
//       await db.run('COMMIT TRANSACTION')
//       result = {
//         success: true
//       }
//     } catch (error) {
//       console.error(error)
//       await db.run('ROLLBACK TRANSACTION')
//       result = {
//         success: false,
//         error: error
//       }
//     }
//     return result
//   }).catch(error => {
//     return {
//       success: false,
//       error: error
//     }
//   })
// }
