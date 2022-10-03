const SQL = require("../database/sql/sql.json");
const { get, list, runInternal } = require("./baseService");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { sequelize, QueryTypes, Op, Models, beginTx } = require("../database/sequelize");
const {
  BusinessCategoryModel,
  TemplateModel,
  TplPhGrpRelModel,
  BcTplRelModel,
  PlaceholderGroupModel,
  PlaceholderItemModel,
  PhGrpItmRelModel
} = Models;

// TODO 添加功能，根据级联业务类型选择器中选择的业务类型，查询所有子类型（含自身）所关联的模板（排除当前业务类型已经关联的模板），
// 用于添加模板时，可以从现有模板中选择。 *原有功能为添加新模板

/**
 * 级联查询业务分类
 * 
 * @returns 业务分类（级联）
 */
export async function findBusinessCategoryCascaded() {
  return await beginTx(async tx => {
    return await BusinessCategoryModel.findAll({
      where: {
        [Op.and]: [
          {
            id: {
              [Op.notIn]: sequelize.literal(
                `(SELECT root.id FROM BusinessCategories AS root WHERE root.pid == root.id)`
              ),
            },
          },
          {
            pid: {
              [Op.in]: sequelize.literal(
                `(SELECT root.id FROM BusinessCategories AS root WHERE root.pid == root.id)`
              ),
            },
          },
        ],
      },
      order: [
        ["ordinal"],
        [sequelize.col("children.ordinal")],
        [sequelize.col("children->children.ordinal")],
      ],
      attributes: ["id", "name", "icon", "ordinal"],
      include: {
        model: BusinessCategoryModel,
        as: "children",
        attributes: ["id", "name", "icon", "ordinal"],
        include: {
          model: BusinessCategoryModel,
          as: "children",
          attributes: ["id", "name", "icon", "ordinal"],
        },
      },
    }).then((result) => {
      const formatted = [];
      const format = (items, formatted) => {
        items.forEach((item) => {
          const dataValues = item.dataValues;
          const children = item.children;
          const formattedItem = {
            id: dataValues.id,
            name: dataValues.name,
            icon: dataValues.icon,
            ordinal: dataValues.ordinal,
          };
          formatted.push(formattedItem);
          if (children && children.length) {
            formattedItem.children = [];
            format(children, formattedItem.children);
          }
        });
      };
      format(result, formatted);

      return formatted;
    });
  });
}

/**
 * 由于BusinessCategory是自表关联，需要先获取根节点id
 * @returns $root节点id
 */
export async function findBusinessCategoryRoot() {
  return await sequelize.transaction(tx => {
    return BusinessCategoryModel.findOne({
      where: {
        id: sequelize.col('pid')
      },
      attributes: [ 'id' ],
      raw: true
    })
  })
}

export async function findBusinessCategoryByPid({ pid }) {
  return await sequelize.transaction(tx => {
    return BusinessCategoryModel.findAll({
      where: {
        pid: pid,
        id: {
          [Op.ne]: pid
        }
      },
      order: [
        ['ordinal']
      ],
      raw: true
    }).then(result => {
      console.log(result)
      return result
    })
  })
}

/**
 * 保存业务分类
 * 
 * @param {*} item 
 * @returns 
 */
export async function saveBusinessCategory(item) {
  return await bulkSaveBusinessCategory([item]);
}

/**
 * 批量保存业务分类
 * 
 * @param {*} items 
 * @returns 
 */
export async function bulkSaveBusinessCategory(items) {
  return await beginTx(async tx => {
    const model = BusinessCategoryModel;
    for (const item of items) {
      if (item.delete) {
        await model.destroy({
          where: {
            id: item.id,
          },
        });
      } else {
        await model.upsert(item);
      }
    }
  });
}

/**
 * 根据业务分类查询模板
 * @param { {String} } param0 
 * @returns 业务分类列表
 */
export async function findTemplateByBcId({ bcId }) {
  return await beginTx(async tx => {
    return await TemplateModel.findAll({
      attributes: ["id", "name", "path"],
      include: [
        {
          model: BusinessCategoryModel,
          where: {
            id: bcId,
          },
        },
      ],
      order: [ [sequelize.col("BusinessCategories->BcTplRel.ordinal")], ],
      raw: true,
      nest: true,
    }).then((result) =>
      result.map((item) => {
        return {
          id: item.id,
          name: item.name,
          path: item.path,
          ordinal: item.BusinessCategories.BcTplRel.ordinal,
          bcId: item.BusinessCategories.id
        };
      })
    );
  });
}

/**
 * 保存模板
 * 
 * @param {*} item 
 * @returns 
 */
export async function saveTemplate(item) {
  return await bulkSaveTemplate([item]);
}

/**
 * 批量保存模板
 * 
 * @param {[]} items 
 * @returns 
 */
export async function bulkSaveTemplate(items) {
  return await beginTx(async tx => {
    for (const item of items) {
      const businessCategory = await BusinessCategoryModel.findByPk(item.bcId);
      
      if (item.delete) { // 删除
        await TemplateModel.destroy({
          where: {
            id: item.id,
          },
        })
      } else if (item.insert) { // 插入
        await businessCategory.addTemplates(
          await TemplateModel.create({ name: item.name, path: item.path }),
          {
            through: BcTplRelModel,
          }
        );
      } else if (item.sort) { // 排序
        const bcTplRel = await BcTplRelModel.findOne({
          where: {
            bcId: item.bcId,
            tplId: item.id
          }
        })
        await bcTplRel.update({
          ordinal: item.ordinal
        })
      } else { // 更新
        const template = await TemplateModel.findByPk(item.id)
        await template.update({
          name: item.name,
          path: item.path
        })
      }
    }
  });
}

/**
 * 根据模板查询占位符
 * @param { {String} } param0 
 * @returns 业务分类列表
 */
 export async function findPlaceholderByTplId({ tplId }) {
  return await beginTx(async tx => {
    return await PlaceholderGroupModel.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: TemplateModel,
          attributes: ["id"],
          where: {
            id: tplId,
          },
        },
        {
          model: PlaceholderItemModel,
          attributes: ["id", "name", "type", "format"],
        },
      ],
      order: [
        [sequelize.col("Templates->TplPhGrpRel.ordinal")],
        [sequelize.col("PlaceholderItems->PhGrpItmRel.ordinal")],
      ],
      // raw: true,
      // nest: true,
    }).then((result) =>
      result.map(({ dataValues: group, PlaceholderItems: phItems, Templates: tpls }) => {
        return {
          id: group.id,
          name: group.name,
          ordinal: tpls[0].TplPhGrpRel.dataValues.ordinal,
          placeholders: phItems.map(({ dataValues: item }) => {
            return {
              id: item.id,
              name: item.name,
              type: item.type,
              format: item.format,
              value: "",
              ordinal: item.PhGrpItmRel.dataValues.ordinal
            }
          })
        };
      })
    );
  });
}

/**
 * 查询所有不属于当前模板的占位符分组
 * 
 * @param {*} param0 
 */
export async function findPlaceholderByTplIdExcluded({ tplId }) {
  return await beginTx(async tx => {
    return await PlaceholderGroupModel.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: TemplateModel,
          attributes: [ "id", "name" ],
          where: {
            id: {
              [Op.ne]: tplId
            }
          }
        },
        {
          model: PlaceholderItemModel,
        }
      ],
      order: [
        [sequelize.col("Templates->TplPhGrpRel.ordinal")],
        [sequelize.col("PlaceholderItems->PhGrpItmRel.ordinal")],
      ],
    }).then(result => 
      result.map(({ dataValues: group, Templates: tpls, PlaceholderItems: phItms }) => {
        return {
          id: group.id,
          name: group.name,
          templates: tpls.map(({ dataValues: tpl })=>{
            return {
              id: tpl.id,
              name: tpl.name
            }
          }),
          placeholderItems: phItms.map(({ dataValues: phItm }) => {
            return {
              id: phItm.id,
              name: phItm.name,
              type: phItm.type,
              format: phItm.format,
              ordinal: phItm.PhGrpItmRel.dataValues.ordinal
            }
          })
        }
      })
    )
  })
}


/**
 * 保存占位符分组
 * 
 * @param {*} item 
 * @returns 
 */
 export async function savePlaceholderGroup(item) {
  return await bulkSavePlaceholderGroup([item]);
}


/**
 * 批量保存占位符分组 TODO 待测试，模板编辑也需要考虑复杂情况
 * 
 * @param {[]} items 
 * @returns 
 */
 export async function bulkSavePlaceholderGroup(items) {
  return await beginTx(async tx => {
    for (const item of items) {
      const template = await TemplateModel.findByPk(item.tplId)
      if (item.delete) {
        // TODO 是否会残留未与分组绑定的占位符？
        await PlaceholderGroupModel.destroy({
          where: {
            id: item.id,
          },
        })
      } else if (item.insert) {
        const placeholderGroup = await PlaceholderGroupModel.create({
          name: item.name,
        })
        await template.addPlaceholderGroups(
          placeholderGroup, {
            through: TplPhGrpRelModel
          }
        )

        for (const phItem of item.placeholderItems) {
          if (phItem.delete) {
            // dead code
            await PlaceholderItemModel.destroy({
              where: {
                id: phItem.id,
              },
            })
          } else if (phItem.insert) {
            await placeholderGroup.addPlaceholderItems(
              await PlaceholderItemModel.create({
                name: phItem.name,
                type: phItem.type,
                format: phItem.format
              }), {
                through: PhGrpItmRelModel
              }
            )
          } else if (phItem.sort) {
            // dead code
            const phGrpItmRel = await PhGrpItmRelModel.findOne({
              where: {
                phGrpId: phItem.phGrpId,
                phItmId: phItem.id
              }
            })
            await phGrpItmRel.update({
              ordinal: phItem.ordinal
            })
          } else {
            // dead code
            const placeholderItem = await PlaceholderItemModel.findByPk(itphItemem.id)
            await placeholderItem.update({
              name: phItem.name,
              type: phItem.type,
              format: phItem.format
            })
          }
        }
      } else if (item.sort) {
        const tplPhGrpRel = await TplPhGrpRelModel.findOne({
          where: {
            tplId: item.tplId,
            phGrpId: item.id
          }
        })
        await tplPhGrpRel.update({
          ordinal: item.ordinal
        })
      } else {
        const placeholderGroup = await PlaceholderGroupModel.findByPk(item.id)
        await placeholderGroup.update({
          name: item.name,
        })
        
        for (const phItem of item.placeholderItems) {
          if (phItem.delete) {
            await PlaceholderItemModel.destroy({
              where: {
                id: phItem.id,
              },
            })
          } else if (phItem.insert) {
            await placeholderGroup.addPlaceholderItems(
              await PlaceholderItemModel.create({
                name: phItem.name,
                type: phItem.type,
                format: phItem.format
              }), {
                through: PhGrpItmRelModel
              }
            )
          } else if (phItem.sort) {
            const phGrpItmRel = await PhGrpItmRelModel.findOne({
              where: {
                phGrpId: phItem.phGrpId,
                phItmId: phItem.id
              }
            })
            await phGrpItmRel.update({
              ordinal: phItem.ordinal
            })
          } else {
            const placeholderItem = await PlaceholderItemModel.findByPk(itphItemem.id)
            await placeholderItem.update({
              name: phItem.name,
              type: phItem.type,
              format: phItem.format
            })
          }
        }
      }
    }
  })
}

// export async function bulkSavePlaceholderItem({ items }) {
//   return await beginTx(async tx => {
//     const 
//   })
// }

// 新增分组： 模板关系（自动） <- 占位符分组 + 占位符(*1) -> 占位符关系（自动）
// 修改分组： 占位符分组 + 占位符(*1) -> 占位符关系（自动）
// 删除分组： 模板关系（自动） <- 占位符分组 + 占位符(*1) -> 占位符关系（自动）
// *1 新增占位符时，自动检测是否是已经存在的占位符，已存在则不新建占位符。
//    修改占位符时，自动检测该占位符是否已与其他占位符分组建立关系。
//        若占位符已被其他模板使用，则提示用户此次修改会影响其他模板是否继续
//            是：修改
//            否：取消修改 注：正确操作为修改模板文件中的占位符名称后覆盖当前模板文件（TODO 此操作会废除原有模板并断开与占位符分组的关系））
/**
 * 新增占位符分组（TODO 可以选择已经存在的占位符分组，是否根据模板中读取的占位符列表来筛选占位符分组？？）：
 *     1. 插入占位符分组表（optional）
 *     2. 插入模板占位符分组关系表
 *     3. 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */


// /**
//  * 保存模板
//  * 
//  * @param {*} item 
//  * @returns 
//  */
// export async function saveTemplate(item) {
//   return await bulkSaveTemplate([item]);
// }

// /**
//  * 批量保存模板
//  * 
//  * @param {[]} items 
//  * @returns 
//  */
// export async function bulkSaveTemplate(items) {
//   return await beginTx(async tx => {
//     for (const item of items) {
//       const businessCategory = await BusinessCategoryModel.findByPk(item.bcId);
      
//       if (item.delete) { // 删除
//         await TemplateModel.destroy({
//           where: {
//             id: item.id,
//           },
//         })
//       } else if (item.insert) { // 插入
//         await businessCategory.addTemplates(
//           await TemplateModel.create({ name: item.name, path: item.path }),
//           {
//             through: BcTplRelModel,
//           }
//         );
//       } else if (item.sort) { // 排序
//         const bcTplRel = await BcTplRelModel.findOne({
//           where: {
//             bcId: item.bcId,
//             tplId: item.id
//           }
//         })
//         await bcTplRel.update({
//           ordinal: item.ordinal
//         })
//       } else { // 更新
//         const template = await TemplateModel.findByPk(item.id)
//         await template.update({
//           name: item.name,
//           path: item.path
//         })
//       }
//     }
//   });
// }


// TODO 是否还需要？
export async function findOwnerlessTemplate() {
  return await sequelize.transaction((tx) => {
    // TODO sql需要更新表
    return sequelize.query(SQL.listOwnerlessTemplateSql, {
      type: QueryTypes.SELECT,
    });
  });
}

//-------------------------------------------------------------------------

export function listBusinessCategoryAll() {
  return list(SQL.listBusinessCategoryAllSql, (result) =>
    result.map((e) => {
      return {
        id: e.ID,
        name: e.NAME,
        icon: e.ICON || "",
        sort: e.SORT,
      };
    })
  );
}

export function getBusinessCategoryOptions() {
  return list(SQL.listBusinessCategoryAllSql, (result) =>
    result.map((e) => {
      return {
        value: e.ID,
        text: e.NAME,
        icon: e.ICON || "",
        index: e.SORT,
      };
    })
  );
}

export function listPlaceholderByTemplateId(templateId) {
  return list(
    SQL.listPlaceholderByTemplateIdSql,
    {
      "@templateId": templateId,
    },
    (result) =>
      result.map((e) => {
        return {
          groupId: e.PGID,
          group: e.PGNAME,
          id: e.PHID,
          name: e.PHNAME,
          type: e.PHTYPE,
          format: e.PHFORMAT,
          count: 0,
          value: "",
        };
      })
  );
}

export function listPlaceholderGroupByTemplateId(templateId) {
  return list(
    SQL.listPlaceholderGroupByTemplateIdSql,
    {
      "@templateId": templateId,
    },
    (result) =>
      result.map((e) => {
        return {
          id: e.ID,
          name: e.NAME,
          value: null,
        };
      })
  );
}

export function listTemplateByBusinessCategoryId(businessCategoryId) {
  return list(
    SQL.listTemplateByBusinessCategoryIdSql,
    {
      "@businessCategoryId": businessCategoryId,
    },
    (result) =>
      result.map((e) => {
        return {
          id: e.ID,
          name: e.NAME,
          path: e.PATH,
        };
      })
  );
}

export function listOwnerlessTemplate() {
  return list(SQL.listOwnerlessTemplateSql, (result) =>
    result.map((e) => {
      return {
        value: e.ID,
        text: e.NAME,
        path: e.PATH,
      };
    })
  );
}

export async function saveTemplate2(item) {
  return await runInternal(async (db) => {
    if (item.insert) {
      const rst1 = await db.run(SQL.saveTemplateSql, {
        "@id": item.id,
        "@name": item.name,
        "@path": item.path,
        "@lastchange": moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      console.log("TEMPLATE inserted.");
      const rst2 = await db.run(SQL.insertBcTplRelSql, {
        "@id": uuidv4(),
        "@bcid": item.bcid,
        "@tplid": item.id,
      });
      console.log("BC_TPL_REL inserted.");
    } else if (item.delete) {
      const rst1 = await db.run(SQL.deleteBcTplRelByTemplateIdSql, {
        "@templateId": item.id,
      });
      console.log("BC_TPL_REL deleted.");
      const rst2 = await db.run(SQL.deleteTplPhgrpRelByTemplateIdSql, {
        "@templateId": item.id,
      });
      console.log("TPL_PHGRP_REL deleted.");
      const rst3 = await db.run(SQL.deleteTemplateSql, {
        "@id": item.id,
      });
      console.log("TEMPLATE deleted.");
    } else {
      // default: update
      const rst = await db.run(SQL.saveTemplateSql, {
        "@id": item.id,
        "@name": item.name,
        "@path": item.path,
        "@lastchange": moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      console.log("TEMPLATE updated.");
    }
  });
}

export async function insertTemplate(item) {
  return await runInternal(async (db) => {
    const rst = await db.run(SQL.insertTemplateSql, {
      "@id": item.id,
      "@name": item.name,
      "@path": item.path,
      "@lastchange": moment().format("YYYY-MM-DD HH:mm:ss"),
    });
    console.log(rst);
  });
}

export async function updateTemplate(item) {
  return await runInternal(async (db) => {
    const rst = await db.run(SQL.updateTemplateSql, {
      "@id": item.id,
      "@name": item.name,
      "@path": item.path,
      "@lastchange": moment().format("YYYY-MM-DD HH:mm:ss"),
    });
    console.log(rst);
  });
}

export async function savePlaceholder(item) {
  return await runInternal(async (db) => {
    if (item.insert) {
      const rst1 = await db.run(SQL.savePlaceholderGroupSql, {
        "@id": item.groupId,
        "@name": item.groupName,
      });
      console.log(rst1);
      await item.items.forEach(async (ph) => {
        const rst2 = await db.run(SQL.savePlaceholderItemSql, {
          "@id": ph.id,
          "@name": ph.name,
          "@type": ph.type,
          "@format": ph.format,
        });
        console.log(rst2);
        const rst3 = await db.run(SQL.insertPhGroupItemRelSql, {
          "@id": uuidv4(),
          "@phGrpId": item.groupId,
          "@phId": ph.id,
          "@sort": ph.sort,
        });
        console.log(rst3);
      });
      const rst4 = await db.run(SQL.insertTplPhgrpRelSql, {
        "@id": uuidv4(),
        "@tplId": item.templateId,
        "@phGrpId": item.groupId,
        "@sort": item.groupSort,
      });
      console.log(rst4);
    }
  });
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
