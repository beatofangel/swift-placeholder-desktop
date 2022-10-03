const sqlite3 = require('sqlite3')
const { Sequelize, DataTypes, QueryTypes, Op } = require('sequelize')
const cls = require('cls-hooked')
const namespace = cls.createNamespace('swift-placeholder-namespace')
Sequelize.useCLS(namespace)
// TODO upsert方法暂时有bug，修正已合并到7.0.0-alpha.16（https://github.com/sequelize/sequelize/pull/14853），等待正式版发布
const sequelize = new Sequelize({
  dialectModule: sqlite3, // https://github.com/sequelize/sequelize/issues/11677#issuecomment-553790367
  dialect: 'sqlite',
  storage: 'database/userdata.db',
  logging: console.log,
  sync: process.env.NODE_ENV !== 'production'
})

// try {
//   await sequelize.authenticate()
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error)
//   throw error
// }

const BusinessCategoryModel = sequelize.define('BusinessCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // pid: {
  //   type: DataTypes.UUID,
  // },
  name: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
  icon: {
    type: DataTypes.TEXT
  },
  ordinal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
})

/** 模板Model */
const TemplateModel = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
  path: {
    type: DataTypes.TEXT,
    allowNull: false
  },
})

/** 占位符分组Model */
const PlaceholderGroupModel = sequelize.define('PlaceholderGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
})

/** 占位符项目Model */
const PlaceholderItemModel = sequelize.define('PlaceholderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
  type: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  format: {
    type: DataTypes.TEXT
  },
})

/** 分类与模板关系Model */
const BcTplRelModel = sequelize.define('BcTplRel', {
  ordinal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
}, {
  hooks: {
    // INSERT: 实现序号自增
    beforeBulkCreate: async (instances, options) => {
      console.log('beforeBulkCreate', options)
      for (const instance of instances) {
        const cnt = await BcTplRelModel.count({
          where: {
            bcId: instance.bcId
          }
        })
        instance.ordinal = cnt + 1
        console.log(instance)
      }
    },
    afterBulkDestroy: async (options) => {
      console.log('afterBulkDestroy', options)
    }
  }
})

/** 模板与占位符分组关系Model */
const TplPhGrpRelModel = sequelize.define('TplPhGrpRel', {
  ordinal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
}, {
  hooks: {
    // INSERT: 实现序号自增
    beforeBulkCreate: async (instances, options) => {
      console.log('beforeBulkCreate', options)
      for (const instance of instances) {
        const cnt = await TplPhGrpRelModel.count({
          where: {
            tplId: instance.tplId
          }
        })
        instance.ordinal = cnt + 1
        console.log(instance)
      }
    },
    afterBulkDestroy: async (options) => {
      console.log('afterBulkDestroy', options)
    }
  }
})

/** 占位符分组与项目关系Model */
const PhGrpItmRelModel = sequelize.define('PhGrpItmRel', {
  ordinal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
}, {
  hooks: {
    // INSERT: 实现序号自增
    beforeBulkCreate: async (instances, options) => {
      console.log('beforeBulkCreate', options)
      for (const instance of instances) {
        const cnt = await PhGrpItmRelModel.count({
          where: {
            phGrpId: instance.phGrpId
          }
        })
        instance.ordinal = cnt + 1
        console.log(instance)
      }
    },
    afterBulkDestroy: async (options) => {
      console.log('afterBulkDestroy', options)
    }
  }
})

const SettingModel = sequelize.define('Setting', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'BOOL',
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
  }
})

BusinessCategoryModel.hasMany(BusinessCategoryModel, {
  as: 'children',
  foreignKey: 'pid',
  onDelete: 'CASCADE'
})

BusinessCategoryModel.belongsToMany(TemplateModel, {
  through: BcTplRelModel,
  foreignKey: 'bcId',
})

TemplateModel.belongsToMany(BusinessCategoryModel, {
  through: BcTplRelModel,
  foreignKey: 'tplId',
})

TemplateModel.belongsToMany(PlaceholderGroupModel, {
  through: TplPhGrpRelModel,
  foreignKey: 'tplId',
})

PlaceholderGroupModel.belongsToMany(TemplateModel, {
  through: TplPhGrpRelModel,
  foreignKey: 'phGrpId',
})

PlaceholderGroupModel.belongsToMany(PlaceholderItemModel, {
  through: PhGrpItmRelModel,
  foreignKey: 'phGrpId',
})

PlaceholderItemModel.belongsToMany(PlaceholderGroupModel, {
  through: PhGrpItmRelModel,
  foreignKey: 'phItmId',
})

// const isDevelopment = process.env.NODE_ENV !== 'production'
// isDevelopment && sequelize.sync({ alter: true });

const Models = {
  BusinessCategoryModel,
  TemplateModel,
  PlaceholderItemModel,
  PlaceholderGroupModel,
  BcTplRelModel,
  TplPhGrpRelModel,
  PhGrpItmRelModel,
  SettingModel
}

// TODO 所有service请求都要修改
export async function beginTx(callback) {
  return await sequelize.transaction(callback)
}

export function getModel(modelName) {
  const model = Models[`${modelName}Model`]
  if (!model) throw `Model with name ${modelName} not found.`
  return model
}

export {
  sequelize,
  QueryTypes,
  Op,
  Models
}
