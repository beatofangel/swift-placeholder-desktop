import { localize } from "vee-validate";
import message_zh from "./message_zh.json"
import { extend } from "vee-validate";
// import i18n from '../i18n'
// import locales from '../locales'
import * as rules from 'vee-validate/dist/rules'
import zh_CN from 'vee-validate/dist/locale/zh_CN.json'
// // import en from 'vee-validate/dist/locale/en.json'

Object.keys(rules).forEach(rule => {
  extend(rule, rules[rule])
});
extend('requiredInput', rules['required'])
extend('requiredSelect', rules['required'])
extend('requiredInputObject', {
  params: [ 'field' ],
  validate: (value, { field }) => {
    if (value && typeof value == 'object') {
      return !!value[field]
    } else {
      return !!value
    }
  },
  computesRequired: true
})

// const v_langs = [ zh/* , en */ ];
// Object.keys(locales).forEach(lang => {
//   v_langs.forEach(v_lang => {
//     if (v_lang.code.startsWith(lang)) {
//       locales[lang].messages.validations || (locales[lang].messages.validations = {})
//       Object.assign(locales[lang].messages.validations, v_lang.messages)
//     }
//   })
// });

// configure({
//   defaultMessage: (field, values) => {
//     // override the field name.
//     // values._field_ = i18n.t(field);
//     return i18n.t(`validations.${values._rule_}`, values);
//   }
// });

localize({ zh_CN })
localize('zh_CN', message_zh);