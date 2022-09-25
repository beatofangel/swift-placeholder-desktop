// Styles
import "vuetify/src/components/VTextField/VTextField.sass";
import "vuetify/src/components/VSelect/VSelect.sass"; // Components
import "./VCascadeSelect.css";

import VChip from "vuetify/lib/components/VChip";
import VMenu from "vuetify/lib/components/VMenu";
import VCascadeSelectList from "./VCascadeSelectList"; // Extensions

import VInput from "vuetify/lib/components/VInput";
import VTextField from "vuetify/lib/components/VTextField/VTextField"; // Mixins

import Comparable from "vuetify/lib/mixins/comparable";
import Dependent from "vuetify/lib/mixins/dependent";
import Filterable from "vuetify/lib/mixins/filterable"; // Directives

import ClickOutside from "vuetify/lib/directives/click-outside"; // Utilities
import Scroll from "vuetify/lib/directives/scroll"; // Utilities

import mergeData from "vuetify/lib/util/mergeData";
import {
  getPropertyFromItem,
  getObjectValueByPath,
  keyCodes,
} from "vuetify/lib/util/helpers";
// import { consoleError } from "vuetify/lib/util/console"; // Types

import mixins from "vuetify/lib/util/mixins";
import { VCard, VCardText } from "vuetify/lib/components/VCard";
import { VDivider, VIcon } from "vuetify/lib/components";
import goTo from "vuetify/lib/services/goto";
// import { VIcon, VList, VListItem, VListItemGroup, VListItemTitle, VListItemAction, VListItemContent } from "vuetify/lib/components";
// import { isNumber } from "lodash"
export const defaultMenuProps = {
  closeOnClick: false,
  closeOnContentClick: false,
  disableKeys: true,
  openOnClick: false,
  maxHeight: 296,//304,
}; // Types

const baseMixins = mixins(VTextField, Comparable, Dependent, Filterable);
/* @vue/component */
const defaultItemCount = 5

export default baseMixins.extend().extend({
  name: "v-cascade-select",
  directives: {
    ClickOutside,
    Scroll
  },
  props: {
    appendIcon: {
      type: String,
      default: "$dropdown",
    },
    attach: {
      type: null,
      default: false,
    },
    cacheItems: Boolean,
    // chips: Boolean,
    clearable: Boolean,
    // deletableChips: Boolean,
    disableLookup: Boolean,
    eager: Boolean,
    // hideSelected: Boolean,
    items: {
      type: Array,
      default: () => [],
    },
    itemColor: {
      type: String,
      default: "primary",
    },
    itemDisabled: {
      type: [String, Array, Function],
      default: "disabled",
    },
    itemText: {
      type: [String, Array, Function],
      default: "text",
    },
    itemValue: {
      type: [String, Array, Function],
      default: "value",
    },
    menuProps: {
      type: [String, Array, Object],
      default: () => defaultMenuProps,
    },
    // multiple: Boolean,
    openOnClear: Boolean,
    returnObject: Boolean,
    // smallChips: Boolean,
  },

  data() {
    return {
      cachedItems: this.cacheItems ? this.items : [],
      menuIsBooted: false,
      isMenuActive: false,
      lastItem: 20,
      // As long as a value is defined, show it
      // Otherwise, check if multiple
      // to determine which default to provide
      lazyValue:
        this.value !== undefined ? this.value : undefined,
        // this.value !== undefined ? this.value : this.multiple ? [] : undefined,
      // selectedIndex: -1,
      // selectedItems: [],
      selectedLevel1Items: [],
      selectedLevel2Items: [],
      selectedLevel3Items: [],
      keyboardLookupPrefix: "",
      keyboardLookupLastTime: 0,
      level1Selected: [],
      level2Selected: [],
      level3Selected: [],
      level1ScrollTop: true,
      level2ScrollTop: true,
      level3ScrollTop: true,
      level1ScrollBottom: true,
      level2ScrollBottom: true,
      level3ScrollBottom: true,
      colors: [ 'primary', 'light-green', 'orange' ]
    };
  },

  computed: {
    /* All items that the select has */
    allItems() {
      return this.filterDuplicates(this.cachedItems.concat(this.flattedItems));
      // return this.filterDuplicates(this.cachedItems.concat(this.items));
    },
    flattedItems() {
      const flatted = [];
      const nextLevel = (arr) => {
        arr.forEach((item) => {
          flatted.push(item);
          item.children && nextLevel(item.children);
        });
      };

      nextLevel(this.items);

      return flatted;
    },
    classes() {
      return {
        ...VTextField.options.computed.classes.call(this),
        "v-select": true,
        // "v-select--chips": this.hasChips,
        // "v-select--chips": true,
        // "v-select--chips--small": this.smallChips,
        "v-select--is-menu-active": this.isMenuActive,
        // "v-select--is-multi": this.multiple,
      };
    },

    /* Used by other components to overwrite */
    computedItems() {
      return this.allItems;
    },

    computedOwns() {
      return `list-${this._uid}`;
    },

    directives() {
      return this.isFocused
        ? [
            {
              name: "click-outside",
              value: {
                handler: this.blur,
                closeConditional: this.closeConditional,
                include: () => this.getOpenDependentElements(),
              },
            },
          ]
        : undefined;
    },

    dynamicHeight() {
      return "auto";
    },

    isDirty() {
      // return this.level1Selected.length > 0
      return this.levelSelectedArray[0].length > 0;
      // return this.selectedItems.length > 0;
    },

    virtualizedItems() {
      return this.$_menuProps.auto
        ? this.computedItems
        : this.computedItems.slice(0, this.lastItem);
    },

    menuCanShow: () => true,

    $_menuProps() {
      let normalisedProps =
        typeof this.menuProps === "string"
          ? this.menuProps.split(",")
          : this.menuProps;

      if (Array.isArray(normalisedProps)) {
        normalisedProps = normalisedProps.reduce((acc, p) => {
          acc[p.trim()] = true;
          return acc;
        }, {});
      }

      return {
        ...defaultMenuProps,
        eager: this.eager,
        value: this.menuCanShow && this.isMenuActive,
        nudgeBottom: normalisedProps.offsetY ? 1 : 0,
        ...normalisedProps,
      };
    },
    level1Items() {
      return this.items;
    },
    level2Items() {
      return Array.isArray(this.levelSelectedArray[0]) &&
        this.levelSelectedArray[0].length > 0
        ? (this.level1Items && this.level1Items.length > 0)
          ? this.level1Items[this.levelSelectedArray[0]].children
          : []
        : [];
    },
    level3Items() {
      return Array.isArray(this.levelSelectedArray[1]) &&
        this.levelSelectedArray[1].length > 0
        ? (this.level2Items && this.level2Items.length > 0)
          ? this.level2Items[this.levelSelectedArray[1]].children
          : []
        : [];
    },
    levelItemsArray() {
      return [this.level1Items, this.level2Items, this.level3Items];
    },
    levelSelectedArray() {
      return [this.level1Selected, this.level2Selected, this.level3Selected];
    },
    selectedLevelItems() {
      return [
        this.selectedLevel1Items,
        this.selectedLevel2Items,
        this.selectedLevel3Items,
      ];
    },
    levelScrollTop() {
      return [this.level1ScrollTop, this.level2ScrollTop, this.level3ScrollTop]
    },
    levelScrollBottom() {
      return [this.level1ScrollBottom, this.level2ScrollBottom, this.level3ScrollBottom]
    }
  },
  watch: {
    level1ScrollTop(val) {
      console.log('level1ScrollTop', val)
    },
    level2ScrollTop(val) {
      console.log('level2ScrollTop', val)
    },
    level3ScrollTop(val) {
      console.log('level3ScrollTop', val)
    },
    level1ScrollBottom(val) {
      console.log('level1ScrollBottom', val)
    },
    level2ScrollBottom(val) {
      console.log('level2ScrollBottom', val)
    },
    level3ScrollBottom(val) {
      console.log('level3ScrollBottom', val)
    },
    internalValue(val, oVal) {
      console.log('internalValue changed', val, oVal)
      this.initialValue = val;
      // this.setSelectedItems();

    },

    items: {
      immediate: true,

      handler(val) {
        console.log("items changed");
        if (this.cacheItems) {
          // Breaks vue-test-utils if
          // this isn't calculated
          // on the next tick
          this.$nextTick(() => {
            this.cachedItems = this.filterDuplicates(
              this.cachedItems.concat(val)
            );
          });
        }

        this.initSelectedItems(this.items, 0);
      },
    },
  },
  methods: {
    listScroll(container, up) {
      const current = document.querySelector(container).scrollTop
      const target = current + 48 + (up ? -48 * 3 : 48 * 3)
      goTo(target, { container: container, easing: 'easeInOutCubic', offset: -16 })
    },
    listScrollUp(container) {
      this.listScroll(container, true)
    },
    listScrollDown(container) {
      this.listScroll(container, false)
    },
    // 计算属性必须要直接更新对应的data值才能确保刷新
    updateScrollTop(level, top) {
      switch (level) {
        case 0:
          this.level1ScrollTop = top
          break
        case 1:
          this.level2ScrollTop = top
          break
        case 2:
          this.level3ScrollTop = top
          break
      }
    },
    // 计算属性必须要直接更新对应的data值才能确保刷新
    updateScrollBottom(level, bottom) {
      switch (level) {
        case 0:
          this.level1ScrollBottom = bottom
          break
        case 1:
          this.level2ScrollBottom = bottom
          break
        case 2:
          this.level3ScrollBottom = bottom
          break
      }
    },
    initSelectedItems(obj, level) {
      const path = [];
      const pathFinder = (obj, level) => {
        if (obj && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            path.push(i);
            if (obj[i][this.itemValue] == this.value) {
              return true;
            } else {
              if (obj[i].children) {
                pathFinder(obj[i].children, level + 1);
              } else {
                path.pop();
              }
            }
          }
        }
        return false;
      };

      this.value && pathFinder(obj, level);

      path.forEach((val, idx) => {
        this.levelSelectedArray[idx].splice(0);
        this.levelSelectedArray[idx].push(val);
        
        this.selectedLevelItems[idx].splice(0);
        this.selectedLevelItems[idx].push(this.levelItemsArray[idx][val]);
      });

      console.log(path, this.levelSelectedArray);
    },
    /** @public */
    blur(e) {
      VTextField.options.methods.blur.call(this, e);
      this.isMenuActive = false;
      this.isFocused = false;
      // this.selectedIndex = -1;
      this.setMenuIndex(-1);
    },

    /** @public */
    activateMenu() {
      if (!this.isInteractive || this.isMenuActive) return;
      this.isMenuActive = true;
    },

    clearableCallback() {
      this.levelSelectedArray.forEach(item=>{
        item.splice(0)
      })
      this.setValue2(null);
      this.$nextTick(() => this.$refs.input && this.$refs.input.focus())
      if (this.openOnClear) this.isMenuActive = true;
    },

    closeConditional(e) {
      if (!this.isMenuActive) return true;
      return (
        !this._isDestroyed && // Click originates from outside the menu content
        // Multiple selects don't close when an item is clicked
        (!this.getContent() || !this.getContent().contains(e.target)) && // Click originates from outside the element
        this.$el &&
        !this.$el.contains(e.target) &&
        e.target !== this.$el
      );
    },

    filterDuplicates(arr) {
      const uniqueValues = new Map();

      for (let index = 0; index < arr.length; ++index) {
        const item = arr[index]; // Do not return null values if existant (#14421)

        if (item == null) {
          continue;
        } // Do not deduplicate headers or dividers (#12517)

        if (item.header || item.divider) {
          uniqueValues.set(item, item);
          continue;
        }

        const val = this.getValue(item); // TODO: comparator

        !uniqueValues.has(val) && uniqueValues.set(val, item);
      }

      return Array.from(uniqueValues.values());
    },

    findExistingIndex(item) {
      const itemValue = this.getValue(item);
      return (this.internalValue || []).findIndex((i) =>
        this.valueComparator(this.getValue(i), itemValue)
      );
    },

    getContent() {
      return this.$refs.menu && this.$refs.menu.$refs.content;
    },

    genDefaultSlot() {
      const selections = this.genSelections2();
      const input = this.genInput(); // If the return is an empty array
      // push the input

      if (Array.isArray(selections)) {
        selections.push(input); // Otherwise push it into children
      } else {
        selections.children = selections.children || [];
        selections.children.push(input);
      }

      return [
        this.genFieldset(),
        this.$createElement(
          "div",
          {
            staticClass: "v-select__slot",
            directives: this.directives,
          },
          [
            this.genLabel(),
            this.prefix ? this.genAffix("prefix") : null,
            selections,
            this.suffix ? this.genAffix("suffix") : null,
            this.genClearIcon(),
            this.genIconSlot(),
            this.genHiddenInput(),
          ]
        ),
        this.genMenu(),
        this.genProgress(),
      ];
    },

    genIcon(type, cb, extraData) {
      const icon = VInput.options.methods.genIcon.call(
        this,
        type,
        cb,
        extraData
      );

      if (type === "append") {
        // Don't allow the dropdown icon to be focused
        icon.children[0].data = mergeData(icon.children[0].data, {
          attrs: {
            tabindex: icon.children[0].componentOptions.listeners && "-1",
            "aria-hidden": "true",
            "aria-label": undefined,
          },
        });
      }

      return icon;
    },

    genInput() {
      const input = VTextField.options.methods.genInput.call(this);
      delete input.data.attrs.name;
      input.data = mergeData(input.data, {
        domProps: {
          value: null,
        },
        attrs: {
          readonly: true,
          type: "text",
          "aria-readonly": String(this.isReadonly),
          "aria-activedescendant": getObjectValueByPath(
            this.$refs.menu,
            "activeTile.id"
          ),
          autocomplete: getObjectValueByPath(
            input.data,
            "attrs.autocomplete",
            "off"
          ),
          placeholder:
            !this.isDirty &&
            (this.persistentPlaceholder || this.isFocused || !this.hasLabel)
              ? this.placeholder
              : undefined,
        },
        on: {
          keypress: this.onKeyPress,
        },
      });
      return input;
    },

    genHiddenInput() {
      return this.$createElement("input", {
        domProps: {
          value: this.lazyValue,
        },
        attrs: {
          type: "hidden",
          name: this.attrs$.name,
        },
      });
    },

    genInputSlot() {
      const render = VTextField.options.methods.genInputSlot.call(this);
      render.data.attrs = {
        ...render.data.attrs,
        role: "button",
        "aria-haspopup": "listbox",
        "aria-expanded": String(this.isMenuActive),
        "aria-owns": this.computedOwns,
      };
      return render;
    },

    getDepth(children, parentDepth) {
      let result = parentDepth;
      if (!children || children.length == 0)
        return parentDepth == 0 ? 1 : result;
      const currentDepth = parentDepth + 1;
      result = parentDepth + 1;
      for (const child of children) {
        const depth = this.getDepth(child.children, currentDepth);
        if (depth > result) {
          result = depth;
        }
      }
      // if (result > 3) throw '最多支持3层结构'
      return result > 3 ? 3 : result;
    },

    listData2(level) {
      const scopeId = this.$vnode && this.$vnode.context.$options._scopeId;
      const attrs = scopeId
        ? {
            [scopeId]: true,
          }
        : {};
      return {
        attrs: { ...attrs, id: this.computedOwns },
        props: {
          // action: this.multiple,
          level: level,
          color: this.colors[level],
          // color: this.itemColor,
          dense: this.dense,
          // hideSelected: this.hideSelected,
          items: this.levelItemsArray[level],
          itemDisabled: this.itemDisabled,
          itemText: this.itemText,
          itemValue: this.itemValue,
          // noDataText: this.$vuetify.lang.t(this.noDataText),
          noDataText: "",
          selectedIndex: this.levelSelectedArray[level],
          selectedItems: this.selectedLevelItems[level],
          isMenuActive: this.isMenuActive,
          maxHeight: defaultMenuProps.maxHeight,
          defaultItemCount: defaultItemCount
          // selectedItems: this.selectedItems,
        },
        class: {
          "py-0": true
        },
        on: {
          select: this.selectItem2,
          "update:scroll-top": (top) => {
            this.updateScrollTop(level, top)
          },
          "update:scroll-bottom": (bottom) => {
            this.updateScrollBottom(level, bottom)
          }
        },
        scopedSlots: {
          item: this.$scopedSlots.item,
        },
      };
    },

    genListCard() {
      const depth = this.getDepth(this.items, 0);
      const list = [];
      for (let i = 0; i < depth; i++) {
        const level = i
        const data = this.listData2(level)
        if (i > 0) {
          list.push(this.$createElement(VDivider, { props: { vertical: true } }))
        }
        list.push(
          this.$createElement(
            VCard,
            {
              props: {
                maxHeight: defaultMenuProps.maxHeight,
                tile: true,
                elevation: 0,
              },
              class: {
                "col-12": depth == 1,
                "col-6": depth == 2,
                "col-4": depth == 3,
                "py-1": true,
                "mx-1": true,
              },
              style: {
                display: "flex",
                "flex-direction": "column"
              },
            },
            [
              this.$createElement("div", { style: { "text-align": "center", cursor: this.levelScrollTop[level] ? "auto" : "pointer", height: "24px" }, on: { click: () => this.listScrollUp(`.noScrollBar-${level}`) } }, [this.$createElement(VIcon, { class: { noBgColorIcon: true }, props: { disabled: this.levelScrollTop[level], color: this.colors[level] } }, this.levelScrollTop[level] ? "mdi-blank" : "mdi-chevron-up")]),
              this.$createElement(
                VCardText,
                {
                  style: { "flex-grow": 1 },
                  class: { "pa-0": true, "noScrollBar": true, [`noScrollBar-${level}`]: true, "overflow-y-auto": true },
                  directives: [{
                    name: "scroll",
                    modifiers: { self: true },
                    value: (e) => {
                      if (e.target.scrollTop == 0) {
                        this.updateScrollTop(level, true)
                      } else if (e.target.scrollTop == (e.target.children[0].clientHeight - e.target.clientHeight)) {
                        this.updateScrollBottom(level, true)
                      } else {
                        this.updateScrollTop(level, false)
                        this.updateScrollBottom(level, false)
                      }
                    }
                  }]
                },
                [this.$createElement(VCascadeSelectList, { ...data })]
              ),
              this.$createElement("div", { style: { "text-align": "center", cursor: this.levelScrollBottom[level] ? "auto" : "pointer", height: "24px" }, on: { click: () => this.listScrollDown(`.noScrollBar-${level}`) } }, [this.$createElement(VIcon, { class: { noBgColorIcon: true }, props: { disabled: this.levelScrollBottom[level], color: this.colors[level] } }, this.levelScrollBottom[level] ? "mdi-blank" : "mdi-chevron-down")]),
            ]
          )
        );
      }
      return this.$createElement(
        VCard,
        { props: { tile: true, elevation: 0 } },
        [
          this.$createElement(
            VCardText,
            { class: { "d-flex": true, "flex-nowrap": true, "py-0": true, "pl-0": true, "pr-5": true } },
            list
          ),
        ]
      );
    },

    genMenu() {
      const props = this.$_menuProps;
      props.activator = this.$refs["input-slot"]; // Attach to root el so that
      // menu covers prepend/append icons

      if (
        // TODO: make this a computed property or helper or something
        this.attach === "" || // If used as a boolean prop (<v-menu attach>)
        this.attach === true || // If bound to a boolean (<v-menu :attach="true">)
        this.attach === "attach" // If bound as boolean prop in pug (v-menu(attach))
      ) {
        props.attach = this.$el;
      } else {
        props.attach = this.attach;
      }

      return this.$createElement(
        VMenu,
        {
          attrs: {
            role: undefined,
          },
          props,
          on: {
            input: (val) => {
              this.isMenuActive = val;
              this.isFocused = val;
            },
            scroll: this.onScroll,
          },
          ref: "menu",
        },
        [this.genListCard()]
        // [this.genList()]
      );
    },

    genSelections2() {
      const children = [];
      for (let i = 0; i < 3; i++) {
        if (
          Array.isArray(this.levelSelectedArray[i]) &&
          this.levelSelectedArray[i].length > 0
        ) {
          i && children.push(
            this.$createElement(VIcon, {
              class: { mdi: true, "mdi-chevron-right": true },
            })
          );
          const item = this.levelItemsArray[i][this.levelSelectedArray[i][0]];
          children.push(
            this.$createElement(
              VChip,
              { props: { label: true, outlined: false, color: `${this.colors[i]} lighten-1`, dark: true } },
              [
                this.$createElement(VIcon, { props: { left: true } }, item.icon),
                `${item.sort} - ${this.getText(item)}`,
              ]
            )
          );
        }
      }

      return this.$createElement(
        "div",
        {
          staticClass: "v-select__selections",
        },
        children
      );
    },

    getMenuIndex() {
      return this.$refs.menu ? this.$refs.menu.listIndex : -1;
    },

    getDisabled(item) {
      return getPropertyFromItem(item, this.itemDisabled, false);
    },

    getText(item) {
      return getPropertyFromItem(item, this.itemText, item);
    },

    getValue(item) {
      return getPropertyFromItem(item, this.itemValue, this.getText(item));
    },

    onBlur(e) {
      e && this.$emit("blur", e);
    },

    onClick(e) {
      if (!this.isInteractive) return;

      if (!this.isAppendInner(e.target)) {
        this.isMenuActive = true;
      }

      if (!this.isFocused) {
        this.isFocused = true;
        this.$emit("focus");
      }

      this.$emit("click", e);
    },

    onEscDown(e) {
      e.preventDefault();

      if (this.isMenuActive) {
        e.stopPropagation();
        this.isMenuActive = false;
      }
    },

    onKeyPress(e) {
      // if (this.multiple || !this.isInteractive || this.disableLookup) return;
      if (!this.isInteractive || this.disableLookup) return;
      const KEYBOARD_LOOKUP_THRESHOLD = 1000; // milliseconds

      const now = performance.now();

      if (now - this.keyboardLookupLastTime > KEYBOARD_LOOKUP_THRESHOLD) {
        this.keyboardLookupPrefix = "";
      }

      this.keyboardLookupPrefix += e.key.toLowerCase();
      this.keyboardLookupLastTime = now;
      const index = this.allItems.findIndex((item) => {
        var _a;

        const text = (
          (_a = this.getText(item)) !== null && _a !== void 0 ? _a : ""
        ).toString();
        return text.toLowerCase().startsWith(this.keyboardLookupPrefix);
      });
      const item = this.allItems[index];

      if (index !== -1) {
        this.lastItem = Math.max(this.lastItem, index + 5);
        this.setValue(this.returnObject ? item : this.getValue(item));
        this.$nextTick(() => this.$refs.menu.getTiles());
        setTimeout(() => this.setMenuIndex(index));
      }
    },

    onKeyDown(e) {
      if (this.isReadonly && e.keyCode !== keyCodes.tab) return;
      const keyCode = e.keyCode;
      const menu = this.$refs.menu;
      this.$emit("keydown", e);
      if (!menu) return; // If menu is active, allow default
      // listIndex change from menu

      if (
        this.isMenuActive &&
        [
          keyCodes.up,
          keyCodes.down,
          keyCodes.home,
          keyCodes.end,
          keyCodes.enter,
        ].includes(keyCode)
      ) {
        // TODO 无法触发menu的goTo，原因是menu已无法滚动，需要修改为控制list。（可能需要重写menu）
        this.$nextTick(() => {
          menu.changeListIndex(e);
          this.$emit("update:list-index", menu.listIndex);
        });
      } // If enter, space, open menu

      if ([keyCodes.enter, keyCodes.space].includes(keyCode))
        this.activateMenu(); // If menu is not active, up/down/home/end can do
      // one of 2 things. If multiple, opens the
      // menu, if not, will cycle through all
      // available options

      if (
        !this.isMenuActive &&
        [keyCodes.up, keyCodes.down, keyCodes.home, keyCodes.end].includes(
          keyCode
        )
      )
        return this.onUpDown(e); // If escape deactivate the menu

      if (keyCode === keyCodes.esc) return this.onEscDown(e); // If tab - select item or close menu

      if (keyCode === keyCodes.tab) return this.onTabDown(e); // If space preventDefault

      if (keyCode === keyCodes.space) return this.onSpaceDown(e);
    },

    onMouseUp(e) {
      // eslint-disable-next-line
      if (this.hasMouseDown && e.which !== 3 && this.isInteractive) {
        // If append inner is present
        // and the target is itself
        // or inside, toggle menu
        if (this.isAppendInner(e.target)) {
          this.$nextTick(() => (this.isMenuActive = !this.isMenuActive));
        }
      }

      VTextField.options.methods.onMouseUp.call(this, e);
    },

    onScroll() {
      if (!this.isMenuActive) {
        requestAnimationFrame(() => (this.getContent().scrollTop = 0));
      } else {
        if (this.lastItem > this.computedItems.length) return;
        const showMoreItems =
          this.getContent().scrollHeight -
            (this.getContent().scrollTop + this.getContent().clientHeight) <
          200;

        if (showMoreItems) {
          this.lastItem += 20;
        }
      }
    },

    onSpaceDown(e) {
      e.preventDefault();
    },

    onTabDown(e) {
      const menu = this.$refs.menu;
      if (!menu) return;
      const activeTile = menu.activeTile; // An item that is selected by
      // menu-index should toggled

      if (activeTile && this.isMenuActive) {
      // if (!this.multiple && activeTile && this.isMenuActive) {
        e.preventDefault();
        e.stopPropagation();
        activeTile.click();
      } else {
        // If we make it here,
        // the user has no selected indexes
        // and is probably tabbing out
        this.blur(e);
      }
    },

    onUpDown(e) {
      const menu = this.$refs.menu;
      if (!menu) return;
      e.preventDefault(); // Multiple selects do not cycle their value
      // when pressing up or down, instead activate
      // the menu

      // if (this.multiple) return this.activateMenu();
      const keyCode = e.keyCode; // Cycle through available values to achieve
      // select native behavior

      menu.isBooted = true;
      window.requestAnimationFrame(() => {
        menu.getTiles();
        if (!menu.hasClickableTiles) return this.activateMenu();

        switch (keyCode) {
          case keyCodes.up:
            menu.prevTile();
            break;

          case keyCodes.down:
            menu.nextTile();
            break;

          case keyCodes.home:
            menu.firstTile();
            break;

          case keyCodes.end:
            menu.lastTile();
            break;
        }
        console.log(menu.activeTile)
        // menu.activeTile.scrollIntoView()

        this.selectItem(this.allItems[this.getMenuIndex()]);
      });
    },

    selectItem(item) {
      if (!this.multiple) {
        this.setValue(this.returnObject ? item : this.getValue(item));
        this.isMenuActive = false;
      } else {
        const internalValue = (this.internalValue || []).slice();
        const i = this.findExistingIndex(item);
        i !== -1 ? internalValue.splice(i, 1) : internalValue.push(item);
        this.setValue(
          internalValue.map((i) => {
            return this.returnObject ? i : this.getValue(i);
          })
        ); // There is no item to re-highlight
        // when selections are hidden

        // if (this.hideSelected) {
        //   this.setMenuIndex(-1);
        // } else {
          const index = this.allItems.indexOf(item);

          if (~index) {
            this.$nextTick(() => this.$refs.menu.getTiles());
            setTimeout(() => this.setMenuIndex(index));
          }
        // }
      }
    },

    selectItem2(item, index, level) {
      this.setValue2(this.returnObject ? item : this.getValue(item), level);
      console.log("index", index, "level", level);
      if (level < 3) {
        this.$nextTick(() => {
          if (
            !this.levelSelectedArray[level] ||
            this.levelSelectedArray[level][0] != index
          ) {
            // this.$set(this.levelItemsArray, level + 1, item.children || [])
            this.$set(this.levelSelectedArray[level], 0, index);
          } else {
            // this.levelItemsArray[level + 1].splice(0)
            this.levelSelectedArray[level].splice(0);
          }
          for ( let i = level + 1; i < 3; i++) {
            this.levelSelectedArray[i].splice(0);
          }
        });
      }
      // this.isMenuActive = false;
    },

    setMenuIndex(index) {
      this.$refs.menu && (this.$refs.menu.listIndex = index);
    },

    setSelectedItems2(level) {
      const selectedItems = [];
      const values =
        !Array.isArray(this.internalValue)
          ? [this.internalValue]
          : this.internalValue;

      for (const value of values) {
        const index = this.allItems.findIndex((v) =>
          this.valueComparator(this.getValue(v), this.getValue(value))
        );

        if (index > -1) {
          selectedItems.push(this.allItems[index]);
        }
      }

      console.log('setSelectedItems2(before)', this.selectedLevelItems[level])
      this.selectedLevelItems[level] = selectedItems;
      console.log('setSelectedItems2(after) ', this.selectedLevelItems[level])
    },

    setValue(value) {
      console.log(
        "setValue:",
        "internalValue",
        value
      );
      if (!this.valueComparator(value, this.internalValue)) {
        this.internalValue = value;
        this.$emit("change", value);
      }
    },

    setValue2(value, level) {
      console.log(
        "setValue2:",
        "internalValue",
        value, level
      );
      
      if (level == null) {
        // 仅当清空按钮触发时
        this.internalValue = value
      } else {
        // 若 当前层级已选中
        if (this.levelSelectedArray[level].length > 0) {
          // 若 点击选项是当前层级已选中项
          if (this.valueComparator(value, this.levelItemsArray[level][this.levelSelectedArray[level][0]][this.itemValue])) {
            // 若 当前层级非顶层
            if (level > 0) {
              // 则 切换到上层选中项
              this.internalValue = this.levelItemsArray[level - 1][this.levelSelectedArray[level - 1][0]][this.itemValue]
            } else {
              // 否则 清空选中项
              this.internalValue = null
            }
          } else {
            // 否则 选中当前选项
            this.internalValue = value
          }
        } else {
          // 否则 选中当前选项
          this.internalValue = value
        }
      }
      
      this.setSelectedItems2(level);
      this.$emit("change", value);
    },

    isAppendInner(target) {
      // return true if append inner is present
      // and the target is itself or inside
      const appendInner = this.$refs["append-inner"];
      return (
        appendInner && (appendInner === target || appendInner.contains(target))
      );
    },
  },
});
