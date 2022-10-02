const { sequelize, QueryTypes, Op, Models, beginTx } = require("../database/sequelize");
const { SettingModel } = Models;

export async function findSettingAll() {
  return await beginTx(async tx => {
    return await SettingModel.findAll({
      raw: true
    })
  })
}

export async function saveSetting({ id, value }) {
  return await beginTx(async tx => {
    return await SettingModel.update({
      value: value
    }, {
      where: {
        id: id
      }
    })
  })
}