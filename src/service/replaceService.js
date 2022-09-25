const SQL = require('../database/sql/sql.json')
const { get, list, runInternal } = require('./baseService')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')
const { sequelize, QueryTypes, Op, getModel } = require('../database/sequelize')

export async function findBusinessCategoryCascaded() {
  return await sequelize.transaction(tx => {
    return getModel('BusinessCategory').findAll({
      // where: {
      //   id: {
      //     [Op.ne]: '319f8bd1-0210-4a45-83d5-c6cdd01af2a5'
      //   },
      //   pid: {
      //     [Op.eq]: '319f8bd1-0210-4a45-83d5-c6cdd01af2a5'
      //   }
      // },
      // where: sequelize.where({
      //     Model: getModel('BusinessCategory'),
      //     field: 'pid'
      //   }, Op.ne, sequelize.col('BusinessCategory.id')
      // ),
      where: {
        [Op.and]: [
          {
            id: {
              [Op.notIn]: sequelize.literal(`(SELECT root.id FROM BusinessCategories AS root WHERE root.pid == root.id)`)
            }
          },
          {
            pid: {
              [Op.in]: sequelize.literal(`(SELECT root.id FROM BusinessCategories AS root WHERE root.pid == root.id)`)
            }
          },
        ]
        // id: {
        //   [Op.notIn]: {
        //     attributes: {
        //       include: [
        //         sequelize.literal(`SELECT ROOT.ID FROM BusinessCategory AS ROOT WHERE ROOT.PID == ROOT.ID`), 'rootId'
        //       ]
        //     },
        //   }
        // },
        // pid: {
        //   [Op.in]: {
        //     attributes: {
        //       include: [
        //         sequelize.literal(`SELECT ROOT.ID FROM BusinessCategory AS ROOT WHERE ROOT.PID == ROOT.ID`), 'rootId'
        //       ]
        //     },
        //   }
        // }
      },
      order: [
        ['sort'], [sequelize.col('children.sort')], [sequelize.col('children->children.sort')]
      ],
      attributes: [ 'id', 'name', 'icon', 'sort' ],
      include: {
        model: getModel('BusinessCategory'),
        as: 'children',
        attributes: [ 'id', 'name', 'icon', 'sort' ],
        include: {
          model: getModel('BusinessCategory'),
          as: 'children',
          attributes: [ 'id', 'name', 'icon', 'sort' ],
        }
      }
    }).then(result => {
      const formatted = []
      const format = (items, formatted) => {
        items.forEach(item => {
          const dataValues = item.dataValues
          const children = item.children
          const formattedItem = {
            id: dataValues.id,
            name: dataValues.name,
            icon: dataValues.icon,
            sort: dataValues.sort
          }
          formatted.push(formattedItem)
          if (children && children.length) {
            formattedItem.children = []
            format(children, formattedItem.children)
          }
        })
      }
      format(result, formatted)

      return formatted
    })
  })
}

export async function findBusinessCategoryByPid({ pid }) {
  return await sequelize.transaction(tx => {
    return getModel('BusinessCategory').findAll({
      where: {
        pid: pid,
        id: {
          [Op.ne]: pid
        }
      },
      order: [
        ['sort']
      ]
    }).then(result => {
      return result.map(e=>e.dataValues)
    })
  })
}

export async function saveBusinessCategory(item) {
  return await bulkSaveBusinessCategory([ item ])
}

export async function bulkSaveBusinessCategory(items) {
  return await sequelize.transaction(async tx => {
    const model = getModel('BusinessCategory')
    for (const item of items) {
      if (item.delete) {
        await model.destroy({
          where: {
            'id': item.id
          }
        })
      } else {
        await model.upsert(item)
      }
    }
  })
}

export async function findOwnerlessTemplate() {
  return await sequelize.transaction(tx => {
    // TODO sql需要更新表
    return sequelize.query(SQL.listOwnerlessTemplateSql, { type: QueryTypes.SELECT })
  })
}

export async function findTemplateByCategoryId({ primaryCategoryId, secondaryCategoryId, tertiaryCategoryId }) {
  // return await sequelize.transaction(tx => {
  //   return sequelize.query(SQL.findTemplateByCategoryId, {
  //     where: {
  //       catId: tertiaryCategoryId || secondaryCategoryId || primaryCategoryId
  //     },
  //     order: [
  //       [ 'sort' ]
  //     ]
  //   })
  // })
  const model = getModel('Template')
  return await model.findAll({
    where: {
      catId: tertiaryCategoryId || secondaryCategoryId || primaryCategoryId
    },
    order: [
      [ 'sort' ]
    ]
  })
}


//-------------------------------------------------------------------------

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

export function listOwnerlessTemplate() {
  return list(SQL.listOwnerlessTemplateSql, result => result.map(e => {
    return {
      value: e.ID,
      text: e.NAME,
      path: e.PATH
    }
  }))
}

// export async function saveBusinessCategory(items) {
//   return await runInternal(db => {
//     items.forEach(async item => {
//       if (item.delete) {
//         // TODO 删除完成后会留下未与业务分类相关联的模板，需要在新建业务分类的时候增加一个选择无主模板的功能。
//         // 目前模板文件的目录是跟着前任业务分类的，需要修改目录或者别的处理，否则无法关联。
//         console.log(item)
//         await db.run(SQL.deleteBcTplRelByBusinessCategoryIdSql, {
//           '@businessCategoryId': item.id
//         })
//         console.log('BC_TPL_REL deleted.')
//         await db.run(SQL.deleteBusinessCategorySql, {
//           '@id': item.id
//         })
//         console.log('BUSINESS_CATEGORY_USER deleted.')
//       } else {
//         console.log(item)
//         const rst = await db.run(SQL.saveBusinessCategorySql, {
//           '@id': item.id,
//           '@name': item.name,
//           '@icon': item.icon,
//           '@sort': item.sort
//         })
//         console.log(rst)
//       }
//     })
//   })
// }

// TODO
export async function saveTemplate(items) {
  return await runInternal(db => {
    items.forEach(async item => {
      if (item.delete) {
        // TODO 需要做关联删除
        console.log(item)
        await db.run(SQL.deleteBcTplRelByTemplateIdSql, {
          '@templateId': item.id
        })
        console.log('BC_TPL_REL deleted.')
        await db.run(SQL.deleteTplPhgrpRelByTemplateIdSql, {
          '@templateId': item.id
        })
        console.log('TPL_PHGRP_REL deleted.')
        await db.run(SQL.deleteTemplateSql, {
          '@id': item.id
        })
        console.log('TEMPLATE deleted.')
      } else {
        await db.run(SQL.saveTemplateSql, {
          '@id': item.id,
          '@name': item.name,
          '@path': item.path,
          '@lastchange': moment().format("YYYY-MM-DD HH:mm:ss")
        })
        console.log('TEMPLATE saved.')
        if (item.insert) {
          await db.run(SQL.insertBcTplRelSql, {
            '@id': uuidv4(),
            '@bcid': item.bcid,
            '@tplid': item.id
          })
          console.log('BC_TPL_REL inserted.')
        }
      }
    })
  })
}

export async function saveTemplate2(item) {
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

export async function savePlaceholder(item) {
  return await runInternal(async db => {
    if (item.insert) {
      const rst1 = await db.run(SQL.savePlaceholderGroupSql, {
        '@id': item.groupId,
        '@name': item.groupName
      })
      console.log(rst1)
      await item.items.forEach(async ph => {
        const rst2 = await db.run(SQL.savePlaceholderItemSql, {
          '@id': ph.id,
          '@name': ph.name,
          '@type': ph.type,
          '@format': ph.format
        })
        console.log(rst2)
        const rst3 = await db.run(SQL.insertPhGroupItemRelSql, {
          '@id': uuidv4(),
          '@phGrpId': item.groupId,
          '@phId': ph.id,
          '@sort': ph.sort
        })
        console.log(rst3)
      })
      const rst4 = await db.run(SQL.insertTplPhgrpRelSql, {
        '@id': uuidv4(),
        '@tplId': item.templateId,
        '@phGrpId': item.groupId,
        '@sort': item.groupSort
      })
      console.log(rst4)
    }
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
