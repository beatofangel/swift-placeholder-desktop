const sqlite3 = require('sqlite3')
const { Sequelize, DataTypes, QueryTypes } = require('sequelize')
const cls = require('cls-hooked')
const namespace = cls.createNamespace('swift-placeholder-namespace')
Sequelize.useCLS(namespace)
// TODO upsert方法暂时有bug，修正已合并到7.0.0-alpha.16（https://github.com/sequelize/sequelize/pull/14853），等待正式版发布
const sequelize = new Sequelize({
  dialectModule: sqlite3, // https://github.com/sequelize/sequelize/issues/11677#issuecomment-553790367
  dialect: 'sqlite',
  storage: 'database/userdata.db',
  logging: console.log,
  sync: {
    alter: process.env.NODE_ENV !== 'production'
  }
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
  pid: {
    type: DataTypes.UUID,
  },
  name: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
  icon: {
    type: DataTypes.TEXT
  },
  sort: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
})

/** 模板Model */
const TemplateModel = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // bcId: {
  //   type: DataTypes.UUID,
  // },
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

/** 分类与模板关系Model */
const CatTplRelModel = sequelize.define('CatTplRel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  catId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tplId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sort: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
})

/** 模板与占位符分组关系Model */
const TplPhGrpRelModel = sequelize.define('TplPhGrpRel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tplId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  phGrpId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sort: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
})

/** 占位符分组与项目关系Model */
const PhGrpItmRelModel = sequelize.define('PhGrpItmRel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  phGrpId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  phItmId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sort: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
})

BusinessCategoryModel.hasMany(TemplateModel, {
  foreignKey: 'bcId',
})

TemplateModel.belongsTo(BusinessCategoryModel, {
  foreignKey: 'bcId'
})

// const isDevelopment = process.env.NODE_ENV !== 'production'
// isDevelopment && sequelize.sync({ alter: true });

const Models = {
  BusinessCategoryModel,
  TemplateModel,
  PlaceholderItemModel,
  PlaceholderGroupModel,
  CatTplRelModel,
  TplPhGrpRelModel,
  PhGrpItmRelModel
}

export function getModel(modelName) {
  const model = Models[`${modelName}Model`]
  if (!model) throw `Model with name ${modelName} not found.`
  return model
}

export {
  sequelize,
  QueryTypes
}
