(function(e, a) { for(const i in a) e[i] = a[i]; }(window, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	const installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		const ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value !== 'string') for(const key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		const getter = module && module.__esModule ?
/******/ 			function getDefault() { return module.default; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./client/gutenberg/extensions/presets/o2/editor.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./client/gutenberg/extensions/editor-notes/index.js":
/*!***********************************************************!*\
  !*** ./client/gutenberg/extensions/editor-notes/index.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\n__webpack_require__(/*! ./style.scss */ \"./client/gutenberg/extensions/editor-notes/style.scss\");\n\n/** @format */\n\n/**\n * External dependencies\n */\nvar attributes = {\n  notes: {\n    type: 'array'\n  }\n};\n\nvar edit = function edit(_ref) {\n  var notes = _ref.attributes.notes,\n      className = _ref.className,\n      isSelected = _ref.isSelected,\n      setAttributes = _ref.setAttributes;\n  return React.createElement(\"div\", {\n    className: isSelected ? 'is-selected' : ''\n  }, !isSelected && React.createElement(\"span\", {\n    className: \"editor-notes__editor-indicator\"\n  }, React.createElement(\"span\", {\n    role: \"img\",\n    \"aria-label\": \"notebook\"\n  }, \"\\uD83D\\uDCD4\"), \"Editor's Notes: hidden from rendered page\"), React.createElement(_editor.RichText, {\n    tagName: \"p\",\n    className: className,\n    value: notes,\n    onChange: function onChange(newNotes) {\n      return setAttributes({\n        notes: newNotes\n      });\n    }\n  }));\n};\n\nvar save = function save() {\n  return null;\n};\n\n(0, _blocks.registerBlockType)('a8c/editor-notes', {\n  title: \"Editor's Notes\",\n  icon: 'welcome-write-blog',\n  category: 'common',\n  attributes: attributes,\n  edit: edit,\n  save: save\n});\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/editor-notes/index.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/editor-notes/style.scss":
/*!*************************************************************!*\
  !*** ./client/gutenberg/extensions/editor-notes/style.scss ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/editor-notes/style.scss?");

/***/ }),

/***/ "./client/gutenberg/extensions/presets/o2/editor.js":
/*!**********************************************************!*\
  !*** ./client/gutenberg/extensions/presets/o2/editor.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\n__webpack_require__(/*! gutenberg/extensions/editor-notes/index.js */ \"./client/gutenberg/extensions/editor-notes/index.js\");\n\n__webpack_require__(/*! gutenberg/extensions/prev-next/block.js */ \"./client/gutenberg/extensions/prev-next/block.js\");\n\n__webpack_require__(/*! gutenberg/extensions/todo/block.js */ \"./client/gutenberg/extensions/todo/block.js\");\n\n__webpack_require__(/*! gutenberg/extensions/trials/block.js */ \"./client/gutenberg/extensions/trials/block.js\");\n\n__webpack_require__(/*! gutenberg/extensions/trial/block.js */ \"./client/gutenberg/extensions/trial/block.js\");\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/presets/o2/editor.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/prev-next/block.js":
/*!********************************************************!*\
  !*** ./client/gutenberg/extensions/prev-next/block.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\n__webpack_require__(/*! ./style.scss */ \"./client/gutenberg/extensions/prev-next/style.scss\");\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nvar blockAttributes = {\n  prev: {\n    type: 'string',\n    source: 'attribute',\n    selector: 'a:first-child',\n    attribute: 'href'\n  },\n  next: {\n    type: 'string',\n    source: 'attribute',\n    selector: 'a:last-child',\n    attribute: 'href'\n  }\n};\n\nvar save = function save(_ref) {\n  var _ref$attributes = _ref.attributes,\n      prev = _ref$attributes.prev,\n      next = _ref$attributes.next,\n      className = _ref.className,\n      isEditor = _ref.isEditor;\n  return prev || next ? React.createElement(\"div\", {\n    className: isEditor ? className : ''\n  }, prev ? React.createElement(\"a\", {\n    href: prev\n  }, \"\\u2190 Prev\") : React.createElement(\"span\", null, \" \"), next ? React.createElement(\"a\", {\n    href: next\n  }, \"Next \\u2192\") : React.createElement(\"span\", null, \" \")) : React.createElement(_element.Fragment, null);\n};\n\nvar edit = function edit(_ref2) {\n  var attributes = _ref2.attributes,\n      className = _ref2.className,\n      isSelected = _ref2.isSelected,\n      setAttributes = _ref2.setAttributes;\n\n  if (isSelected) {\n    return React.createElement(_element.Fragment, null, React.createElement(_components.TextControl, {\n      label: (0, _i18n.__)('Previous Post'),\n      value: attributes.prev,\n      onChange: function onChange(prev) {\n        return setAttributes({\n          prev: prev\n        });\n      }\n    }), React.createElement(_components.TextControl, {\n      label: (0, _i18n.__)('Next Post'),\n      value: attributes.next,\n      onChange: function onChange(next) {\n        return setAttributes({\n          next: next\n        });\n      }\n    }));\n  }\n\n  if (attributes.prev || attributes.next) {\n    return save({\n      attributes: attributes,\n      className: className,\n      isEditor: true\n    });\n  }\n\n  return React.createElement(\"div\", {\n    style: {\n      textAlign: 'center'\n    }\n  }, \"\\u2190 \", (0, _i18n.__)('Add prev/next links to related posts in a series.'), \" \\u2192\");\n};\n\n(0, _blocks.registerBlockType)('a8c/prev-next', {\n  title: (0, _i18n.__)('Prev/Next Links'),\n  icon: 'leftright',\n  category: 'common',\n  description: (0, _i18n.__)('Link this post to sequential posts in a series of related posts.'),\n  keywords: [(0, _i18n.__)('links')],\n  attributes: blockAttributes,\n  edit: edit,\n  save: save\n});\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/prev-next/block.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/prev-next/style.scss":
/*!**********************************************************!*\
  !*** ./client/gutenberg/extensions/prev-next/style.scss ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/prev-next/style.scss?");

/***/ }),

/***/ "./client/gutenberg/extensions/todo/block.js":
/*!***************************************************!*\
  !*** ./client/gutenberg/extensions/todo/block.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nvar _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ \"./node_modules/@babel/runtime/helpers/defineProperty.js\"));\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _classnames2 = _interopRequireDefault(__webpack_require__(/*! classnames */ \"./node_modules/classnames/index.js\"));\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _item = __webpack_require__(/*! ./item */ \"./client/gutenberg/extensions/todo/item.js\");\n\n__webpack_require__(/*! ./editor.scss */ \"./client/gutenberg/extensions/todo/editor.scss\");\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nvar blockAttributes = {\n  list: {\n    type: 'array',\n    source: 'children',\n    selector: 'ul',\n    default: []\n  }\n};\nvar itemLineRegex = /^([ ]{0,3})([xo#*-])(\\s+)(.*)/;\n\nvar edit =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(edit, _Component);\n\n  function edit() {\n    var _this;\n\n    (0, _classCallCheck2.default)(this, edit);\n    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(edit).apply(this, arguments));\n    _this.addNewItem = _this.addNewItem.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.updateItem = _this.updateItem.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.deleteItem = _this.deleteItem.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.insertNewItemAfter = _this.insertNewItemAfter.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this))); // set the initial items in the state based on the markup that was saved\n\n    var list = _this.props.attributes.list.filter(function (item) {\n      return typeof item !== 'string' || item.trim() !== '';\n    });\n\n    var items = list.map(function (item) {\n      var itemEntry = {};\n      var children = item.props.children;\n      var levelSpan = children[0];\n      var statusSpan = children[1];\n      var valueSpan = children[2];\n      itemEntry.level = undefined !== levelSpan.props.children ? levelSpan.props.children.length : 0;\n      itemEntry.done = 'x' === statusSpan.props.children; // children if it came from html, value if it came from a migration\n\n      itemEntry.value = valueSpan.props.children || valueSpan.props.value;\n      return itemEntry;\n    });\n    _this.state = {\n      items: items,\n      newItemAt: undefined\n    };\n    return _this;\n  }\n\n  (0, _createClass2.default)(edit, [{\n    key: \"componentDidMount\",\n    value: function componentDidMount() {\n      if (0 === this.state.items.length) {\n        this.addNewItem();\n      }\n    }\n  }, {\n    key: \"getNewItem\",\n    value: function getNewItem() {\n      return {\n        value: [],\n        done: false,\n        level: 0\n      };\n    }\n  }, {\n    key: \"insertNewItemAfter\",\n    value: function insertNewItemAfter(index) {\n      var items = this.state.items;\n      items.splice(index + 1, 0, this.getNewItem());\n      this.setState({\n        items: items,\n        newItemAt: index + 1\n      });\n    }\n  }, {\n    key: \"addNewItem\",\n    value: function addNewItem() {\n      var items = this.state.items;\n      items.push(this.getNewItem());\n      this.setState({\n        items: items,\n        newItemAt: items.length - 1\n      });\n    }\n  }, {\n    key: \"swapItems\",\n    value: function swapItems(itemIdx, newIdx) {\n      var items = this.state.items;\n      var item = items[itemIdx];\n      var tmp = items[newIdx];\n      items[newIdx] = item;\n      items[itemIdx] = tmp;\n      this.setState({\n        items: items\n      });\n      this.props.setAttributes({\n        list: this.renderElements(items)\n      });\n    }\n  }, {\n    key: \"moveUp\",\n    value: function moveUp(itemIdx) {\n      if (itemIdx > 0) {\n        this.swapItems(itemIdx, itemIdx - 1);\n      }\n    }\n  }, {\n    key: \"moveDown\",\n    value: function moveDown(itemIdx) {\n      if (itemIdx < this.state.items.length - 1) {\n        this.swapItems(itemIdx, itemIdx + 1);\n      }\n    }\n  }, {\n    key: \"moveLeft\",\n    value: function moveLeft(itemIdx) {\n      var items = this.state.items;\n\n      if (items[itemIdx].level > 0) {\n        items[itemIdx].level--;\n      }\n\n      this.setState({\n        items: items\n      });\n      this.props.setAttributes({\n        list: this.renderElements(items)\n      });\n    }\n  }, {\n    key: \"moveRight\",\n    value: function moveRight(itemIdx) {\n      var items = this.state.items;\n\n      if (items[itemIdx].level < 3 && itemIdx > 0) {\n        items[itemIdx].level++;\n      }\n\n      this.setState({\n        items: items\n      });\n      this.props.setAttributes({\n        list: this.renderElements(items)\n      });\n    }\n  }, {\n    key: \"deleteItem\",\n    value: function deleteItem(index) {\n      var items = this.state.items;\n      var newItems = items.filter(function (item, itemIndex) {\n        return index !== itemIndex;\n      });\n      this.setState({\n        items: newItems,\n        newItemAt: undefined\n      });\n      this.props.setAttributes({\n        list: this.renderElements(newItems)\n      });\n    }\n  }, {\n    key: \"updateItem\",\n    value: function updateItem() {\n      this.props.setAttributes({\n        list: this.renderElements(this.state.items)\n      });\n    }\n  }, {\n    key: \"renderElements\",\n    value: function renderElements(items) {\n      var x = items.map(function (item) {\n        var done = item.done ? 'x' : 'o';\n        return React.createElement(\"li\", null, React.createElement(\"span\", null, ''.repeat(item.level)), React.createElement(\"span\", null, done), React.createElement(_editor.RichText.Content, {\n          tagName: \"span\",\n          value: item.value\n        }));\n      });\n      return x;\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this2 = this;\n\n      var className = this.props.className;\n      var _this$state = this.state,\n          items = _this$state.items,\n          newItemAt = _this$state.newItemAt;\n      return React.createElement(\"div\", {\n        className: className\n      }, React.createElement(\"ul\", {\n        className: className + \"__list\"\n      }, items.map(function (item, itemIndex) {\n        var moveUp = function moveUp() {\n          _this2.moveUp(itemIndex);\n        };\n\n        var moveDown = function moveDown() {\n          _this2.moveDown(itemIndex);\n        };\n\n        var moveLeft = function moveLeft() {\n          _this2.moveLeft(itemIndex);\n        };\n\n        var moveRight = function moveRight() {\n          _this2.moveRight(itemIndex);\n        };\n\n        var onDelete = function onDelete() {\n          _this2.deleteItem(itemIndex);\n        };\n\n        var onChange = function onChange(updatedItem) {\n          _this2.updateItem(updatedItem, itemIndex);\n        };\n\n        var onSplit = function onSplit() {\n          _this2.insertNewItemAfter(itemIndex);\n        };\n\n        var classNames = (0, _classnames2.default)(className + \"__item\", (0, _defineProperty2.default)({}, className + \"__item--done\", item.done)); // if we've inserted an item at this index, and it does not have a value, request focus\n\n        var shouldFocusThisItem = itemIndex === newItemAt && (!item.value || 0 === item.value.length);\n        return React.createElement(_item.ItemEditor, {\n          moveUp: moveUp,\n          moveDown: moveDown,\n          moveLeft: moveLeft,\n          moveRight: moveRight,\n          canMoveUp: itemIndex > 0,\n          canMoveDown: itemIndex < items.length - 1,\n          classNames: classNames,\n          item: item,\n          onDelete: onDelete,\n          onChange: onChange,\n          onSplit: onSplit,\n          shouldFocus: shouldFocusThisItem\n        });\n      })), React.createElement(\"div\", {\n        class: \"add-new-todo-item-form\"\n      }, React.createElement(_components.Button, {\n        onClick: this.addNewItem\n      }, React.createElement(_components.Dashicon, {\n        icon: \"plus\"\n      }), \" Add new item\")));\n    }\n  }]);\n  return edit;\n}(_element.Component);\n\nvar deprecated = [{\n  attributes: {\n    items: {\n      type: 'string'\n    }\n  },\n  save: function save() {\n    return [];\n  },\n  migrate: function migrate(attributes) {\n    var o2list = decodeURIComponent(atob(attributes.items));\n    var o2Items = o2list.split('\\n');\n    var items = [];\n\n    for (var i = 0; i < o2Items.length; i++) {\n      var line = o2Items[i];\n      var lineMatch = line.match(itemLineRegex);\n\n      if (!lineMatch) {\n        continue;\n      }\n\n      var done = lineMatch[2] === 'x';\n      var item = lineMatch[4];\n      var level = lineMatch[1].length;\n      items.push({\n        item: item,\n        done: done,\n        level: level\n      });\n    }\n\n    var list = items.map(function (item) {\n      var done = item.done ? 'x' : 'o';\n      return React.createElement(\"li\", null, React.createElement(\"span\", null, ''.repeat(item.level)), React.createElement(\"span\", null, done), React.createElement(_editor.RichText.Content, {\n        tagName: \"span\",\n        value: item.item\n      }));\n    });\n    return {\n      list: list\n    };\n  }\n}];\n\nvar save =\n/*#__PURE__*/\nfunction (_Component2) {\n  (0, _inherits2.default)(save, _Component2);\n\n  function save() {\n    (0, _classCallCheck2.default)(this, save);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(save).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(save, [{\n    key: \"render\",\n    value: function render() {\n      var list = this.props.attributes.list.filter(function (item) {\n        return typeof item !== 'string' || item.trim() !== '';\n      });\n      return React.createElement(\"ul\", null, list);\n    }\n  }]);\n  return save;\n}(_element.Component);\n\n(0, _blocks.registerBlockType)('a8c/todo', {\n  title: (0, _i18n.__)('Task List'),\n  icon: 'editor-ul',\n  category: 'common',\n  keywords: [(0, _i18n.__)('todo')],\n  attributes: blockAttributes,\n  edit: edit,\n  save: save,\n  deprecated: deprecated\n});\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/todo/block.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/todo/editor.scss":
/*!******************************************************!*\
  !*** ./client/gutenberg/extensions/todo/editor.scss ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/todo/editor.scss?");

/***/ }),

/***/ "./client/gutenberg/extensions/todo/item.js":
/*!**************************************************!*\
  !*** ./client/gutenberg/extensions/todo/item.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.ItemEditor = void 0;\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\n/** @format */\n\n/**\n * External dependencies\n */\nvar ItemEditor =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(ItemEditor, _Component);\n\n  function ItemEditor() {\n    var _this;\n\n    (0, _classCallCheck2.default)(this, ItemEditor);\n    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(ItemEditor).apply(this, arguments));\n    _this.toggleDone = _this.toggleDone.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.updateValue = _this.updateValue.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.onSetup = _this.onSetup.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.editor = undefined;\n    return _this;\n  }\n\n  (0, _createClass2.default)(ItemEditor, [{\n    key: \"componentWillReceiveProps\",\n    value: function componentWillReceiveProps(newProps) {\n      var _this2 = this;\n\n      if (newProps.shouldFocus && !this.props.shouldFocus) {\n        window.requestAnimationFrame(function () {\n          _this2.editor.focus();\n        });\n      }\n    }\n  }, {\n    key: \"toggleDone\",\n    value: function toggleDone() {\n      var item = this.props.item;\n      item.done = !item.done;\n      this.props.onChange(item);\n    }\n  }, {\n    key: \"updateValue\",\n    value: function updateValue(newValue) {\n      var item = this.props.item;\n      item.value = newValue;\n      this.props.onChange(item);\n    }\n  }, {\n    key: \"onSetup\",\n    value: function onSetup(editor) {\n      var _this3 = this;\n\n      var shouldFocus = this.props.shouldFocus;\n      this.editor = editor;\n\n      if (shouldFocus) {\n        window.requestAnimationFrame(function () {\n          _this3.editor.focus();\n        });\n      }\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this$props = this.props,\n          item = _this$props.item,\n          moveUp = _this$props.moveUp,\n          moveDown = _this$props.moveDown,\n          canMoveUp = _this$props.canMoveUp,\n          canMoveDown = _this$props.canMoveDown,\n          classNames = _this$props.classNames,\n          onDelete = _this$props.onDelete;\n      var done = item.done,\n          value = item.value;\n      return React.createElement(\"li\", {\n        className: classNames\n      }, React.createElement(\"span\", {\n        className: \"item-status\",\n        onClick: this.toggleDone\n      }, done && React.createElement(_components.Dashicon, {\n        icon: \"yes\"\n      })), React.createElement(\"span\", {\n        className: \"item-title\"\n      }, React.createElement(_editor.RichText, {\n        tagName: \"div\",\n        value: value,\n        onChange: this.updateValue,\n        multiline: false,\n        onSplit: this.props.onSplit,\n        onSetup: this.onSetup\n      })), React.createElement(\"span\", {\n        className: \"move-buttons\"\n      }, canMoveUp && React.createElement(_components.Button, {\n        onClick: moveUp\n      }, React.createElement(_components.Dashicon, {\n        icon: \"arrow-up-alt2\"\n      })), canMoveDown && React.createElement(_components.Button, {\n        onClick: moveDown\n      }, React.createElement(_components.Dashicon, {\n        icon: \"arrow-down-alt2\"\n      })), React.createElement(_components.Button, {\n        onClick: onDelete\n      }, React.createElement(_components.Dashicon, {\n        icon: \"no\"\n      }))));\n    }\n  }]);\n  return ItemEditor;\n}(_element.Component);\n\nexports.ItemEditor = ItemEditor;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/todo/item.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/trial/block.js":
/*!****************************************************!*\
  !*** ./client/gutenberg/extensions/trial/block.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nvar _extends2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/extends */ \"./node_modules/@babel/runtime/helpers/extends.js\"));\n\nvar _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ \"./node_modules/@babel/runtime/helpers/defineProperty.js\"));\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\n__webpack_require__(/*! ./style.scss */ \"./client/gutenberg/extensions/trial/style.scss\");\n\n__webpack_require__(/*! ./editor.scss */ \"./client/gutenberg/extensions/trial/editor.scss\");\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nvar statuses = [{\n  key: 'new',\n  text: 'New'\n}, {\n  key: 'planned',\n  text: 'Planned'\n}, {\n  key: 'in-progress',\n  text: 'In Progress'\n}, {\n  key: 'needs-completion',\n  text: 'Needs Completion'\n}, {\n  key: 'needs-merging',\n  text: 'Needs Merging'\n}, {\n  key: 'done',\n  text: 'Done :)'\n}];\nvar blockAttributes = {\n  title: {\n    source: 'children',\n    selector: 'header'\n  },\n  description: {\n    source: 'children',\n    selector: 'article'\n  },\n  team: {\n    source: 'children',\n    selector: 'address'\n  },\n  links: {\n    source: 'children',\n    selector: 'aside'\n  },\n  status: {\n    type: 'object',\n    default: statuses[0]\n  }\n};\n\nvar Trial =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(Trial, _Component);\n\n  function Trial() {\n    (0, _classCallCheck2.default)(this, Trial);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Trial).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(Trial, [{\n    key: \"render\",\n    value: function render() {\n      var className = this.props.className;\n      return React.createElement(\"div\", {\n        className: className\n      }, React.createElement(\"header\", null, this.richText('title')), React.createElement(\"div\", null, React.createElement(\"article\", null, this.richText('description')), React.createElement(\"address\", null, this.richText('team')), React.createElement(\"aside\", null, this.richText('links'))), React.createElement(\"footer\", null, this.statusChooser()));\n    }\n  }, {\n    key: \"richText\",\n    value: function richText(attribute) {\n      var _this$props = this.props,\n          attributes = _this$props.attributes,\n          setAttributes = _this$props.setAttributes,\n          edit = _this$props.edit;\n      return edit ? React.createElement(_editor.RichText, {\n        key: 1,\n        placeholder: (0, _i18n.__)(\"Add \" + attribute + \"\\u2026\"),\n        value: attributes[attribute],\n        onChange: function onChange(value) {\n          return setAttributes((0, _defineProperty2.default)({}, attribute, value));\n        }\n      }) : attributes[attribute];\n    }\n  }, {\n    key: \"statusChooser\",\n    value: function statusChooser() {\n      var _this = this;\n\n      var _this$props2 = this.props,\n          attributes = _this$props2.attributes,\n          edit = _this$props2.edit,\n          className = _this$props2.className;\n      var status = attributes.status;\n      return edit ? React.createElement(_components.Dropdown, {\n        contentClassName: className + \"-status-popover\",\n        renderToggle: function renderToggle(_ref) {\n          var onToggle = _ref.onToggle;\n          return _this.statusBadge(status, onToggle);\n        },\n        renderContent: function renderContent() {\n          return _this.allStatusBadges();\n        }\n      }) : this.statusBadge(status, function () {});\n    }\n  }, {\n    key: \"statusBadge\",\n    value: function statusBadge(status, onClick) {\n      var edit = this.props.edit;\n\n      var clickOnEnter = function clickOnEnter(e) {\n        return 'Enter' === e.key && onClick();\n      };\n\n      var optional = edit ? {\n        tabIndex: '0'\n      } : {};\n      return React.createElement(\"span\", (0, _extends2.default)({\n        key: status.key,\n        className: \"status-badge status-\" + status.key,\n        onClick: onClick,\n        onKeyUp: clickOnEnter,\n        role: \"button\",\n        tabIndex: \"0\",\n        \"aria-label\": (0, _i18n.sprintf)('Status: %s', status.text)\n      }, optional), status.text.replace(/ /g, '\\xa0'));\n    }\n  }, {\n    key: \"allStatusBadges\",\n    value: function allStatusBadges() {\n      var _this2 = this;\n\n      var setAttributes = this.props.setAttributes;\n      return React.createElement(\"div\", null, statuses.map(function (status) {\n        return _this2.statusBadge(status, function () {\n          return setAttributes({\n            status: status\n          });\n        });\n      }));\n    }\n  }]);\n  return Trial;\n}(_element.Component);\n\n(0, _blocks.registerBlockType)('a8c/trials-list-item', {\n  title: (0, _i18n.__)('Trial Project (single item)'),\n  icon: 'universal-access',\n  category: 'common',\n  keywords: [(0, _i18n.__)('hiring'), (0, _i18n.__)('devex'), (0, _i18n.__)('trial')],\n  attributes: blockAttributes,\n  parent: ['a8c/trials-list'],\n  edit: function edit(props) {\n    return React.createElement(Trial, (0, _extends2.default)({\n      edit: true\n    }, props));\n  },\n  save: function save(props) {\n    return React.createElement(Trial, (0, _extends2.default)({\n      edit: false\n    }, props));\n  }\n});\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/trial/block.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/trial/editor.scss":
/*!*******************************************************!*\
  !*** ./client/gutenberg/extensions/trial/editor.scss ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/trial/editor.scss?");

/***/ }),

/***/ "./client/gutenberg/extensions/trial/style.scss":
/*!******************************************************!*\
  !*** ./client/gutenberg/extensions/trial/style.scss ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/trial/style.scss?");

/***/ }),

/***/ "./client/gutenberg/extensions/trials/block.js":
/*!*****************************************************!*\
  !*** ./client/gutenberg/extensions/trials/block.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nvar _extends2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/extends */ \"./node_modules/@babel/runtime/helpers/extends.js\"));\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\n/** @format */\n\n/**\n * External dependencies\n */\nvar blockAttributes = {\n  heading: {\n    source: 'children',\n    selector: 'h2'\n  }\n};\n\nvar Heading =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(Heading, _Component);\n\n  function Heading() {\n    (0, _classCallCheck2.default)(this, Heading);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Heading).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(Heading, [{\n    key: \"render\",\n    value: function render() {\n      var _this$props = this.props,\n          className = _this$props.className,\n          edit = _this$props.edit,\n          anchor = _this$props.attributes.anchor;\n      return [anchor ? React.createElement(\"h2\", {\n        key: \"heading\",\n        id: anchor\n      }, this.richText()) : React.createElement(\"h2\", {\n        key: \"heading\"\n      }, this.richText()), React.createElement(\"div\", {\n        key: \"headers\",\n        className: className\n      }, React.createElement(\"header\", null, \"Title\"), React.createElement(\"div\", null, \"Details\"), React.createElement(\"footer\", null, \"Status\")), edit ? React.createElement(_editor.InnerBlocks, {\n        key: \"children\",\n        allowedBlocks: ['a8c/trials-list-item'],\n        template: [['a8c/trials-list-item', {}]],\n        templateLock: false\n      }) : React.createElement(_editor.InnerBlocks.Content, {\n        key: \"children\"\n      })];\n    }\n  }, {\n    key: \"richText\",\n    value: function richText() {\n      var _this$props2 = this.props,\n          attributes = _this$props2.attributes,\n          setAttributes = _this$props2.setAttributes,\n          edit = _this$props2.edit;\n      return edit ? React.createElement(_editor.RichText, {\n        key: 1,\n        placeholder: (0, _i18n.__)(\"Add heading\\u2026\"),\n        value: attributes.heading,\n        onChange: function onChange(value) {\n          return setAttributes({\n            heading: value\n          });\n        }\n      }) : attributes.heading;\n    }\n  }]);\n  return Heading;\n}(_element.Component);\n\n(0, _blocks.registerBlockType)('a8c/trials-list', {\n  title: (0, _i18n.__)('Trial Projects'),\n  icon: 'universal-access-alt',\n  category: 'common',\n  supports: {\n    anchor: true\n  },\n  keywords: [(0, _i18n.__)('hiring'), (0, _i18n.__)('devex'), (0, _i18n.__)('trial')],\n  attributes: blockAttributes,\n  edit: function edit(props) {\n    return React.createElement(Heading, (0, _extends2.default)({\n      edit: true\n    }, props));\n  },\n  save: function save(props) {\n    return React.createElement(Heading, (0, _extends2.default)({\n      edit: false\n    }, props));\n  }\n});\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/trials/block.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/assertThisInitialized.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/assertThisInitialized.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _assertThisInitialized(self) {\n  if (self === void 0) {\n    throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");\n  }\n\n  return self;\n}\n\nmodule.exports = _assertThisInitialized;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/assertThisInitialized.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/classCallCheck.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/classCallCheck.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _classCallCheck(instance, Constructor) {\n  if (!(instance instanceof Constructor)) {\n    throw new TypeError(\"Cannot call a class as a function\");\n  }\n}\n\nmodule.exports = _classCallCheck;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/classCallCheck.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/createClass.js":
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/createClass.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _defineProperties(target, props) {\n  for (var i = 0; i < props.length; i++) {\n    var descriptor = props[i];\n    descriptor.enumerable = descriptor.enumerable || false;\n    descriptor.configurable = true;\n    if (\"value\" in descriptor) descriptor.writable = true;\n    Object.defineProperty(target, descriptor.key, descriptor);\n  }\n}\n\nfunction _createClass(Constructor, protoProps, staticProps) {\n  if (protoProps) _defineProperties(Constructor.prototype, protoProps);\n  if (staticProps) _defineProperties(Constructor, staticProps);\n  return Constructor;\n}\n\nmodule.exports = _createClass;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/createClass.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/defineProperty.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _defineProperty(obj, key, value) {\n  if (key in obj) {\n    Object.defineProperty(obj, key, {\n      value: value,\n      enumerable: true,\n      configurable: true,\n      writable: true\n    });\n  } else {\n    obj[key] = value;\n  }\n\n  return obj;\n}\n\nmodule.exports = _defineProperty;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/defineProperty.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/extends.js":
/*!********************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/extends.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _extends() {\n  module.exports = _extends = Object.assign || function (target) {\n    for (var i = 1; i < arguments.length; i++) {\n      var source = arguments[i];\n\n      for (var key in source) {\n        if (Object.prototype.hasOwnProperty.call(source, key)) {\n          target[key] = source[key];\n        }\n      }\n    }\n\n    return target;\n  };\n\n  return _extends.apply(this, arguments);\n}\n\nmodule.exports = _extends;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/extends.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/getPrototypeOf.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/getPrototypeOf.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _getPrototypeOf(o) {\n  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {\n    return o.__proto__ || Object.getPrototypeOf(o);\n  };\n  return _getPrototypeOf(o);\n}\n\nmodule.exports = _getPrototypeOf;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/getPrototypeOf.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/inherits.js":
/*!*********************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/inherits.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var setPrototypeOf = __webpack_require__(/*! ./setPrototypeOf */ \"./node_modules/@babel/runtime/helpers/setPrototypeOf.js\");\n\nfunction _inherits(subClass, superClass) {\n  if (typeof superClass !== \"function\" && superClass !== null) {\n    throw new TypeError(\"Super expression must either be null or a function\");\n  }\n\n  subClass.prototype = Object.create(superClass && superClass.prototype, {\n    constructor: {\n      value: subClass,\n      writable: true,\n      configurable: true\n    }\n  });\n  if (superClass) setPrototypeOf(subClass, superClass);\n}\n\nmodule.exports = _inherits;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/inherits.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/interopRequireDefault.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/interopRequireDefault.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _interopRequireDefault(obj) {\n  return obj && obj.__esModule ? obj : {\n    default: obj\n  };\n}\n\nmodule.exports = _interopRequireDefault;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/interopRequireDefault.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var _typeof = __webpack_require__(/*! ../helpers/typeof */ \"./node_modules/@babel/runtime/helpers/typeof.js\");\n\nvar assertThisInitialized = __webpack_require__(/*! ./assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\");\n\nfunction _possibleConstructorReturn(self, call) {\n  if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) {\n    return call;\n  }\n\n  return assertThisInitialized(self);\n}\n\nmodule.exports = _possibleConstructorReturn;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/setPrototypeOf.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/setPrototypeOf.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _setPrototypeOf(o, p) {\n  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {\n    o.__proto__ = p;\n    return o;\n  };\n\n  return _setPrototypeOf(o, p);\n}\n\nmodule.exports = _setPrototypeOf;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/setPrototypeOf.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/typeof.js":
/*!*******************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/typeof.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _typeof2(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof2(obj); }\n\nfunction _typeof(obj) {\n  if (typeof Symbol === \"function\" && _typeof2(Symbol.iterator) === \"symbol\") {\n    module.exports = _typeof = function _typeof(obj) {\n      return _typeof2(obj);\n    };\n  } else {\n    module.exports = _typeof = function _typeof(obj) {\n      return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : _typeof2(obj);\n    };\n  }\n\n  return _typeof(obj);\n}\n\nmodule.exports = _typeof;\n\n//# sourceURL=webpack:///./node_modules/@babel/runtime/helpers/typeof.js?");

/***/ }),

/***/ "./node_modules/classnames/index.js":
/*!******************************************!*\
  !*** ./node_modules/classnames/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!\n  Copyright (c) 2017 Jed Watson.\n  Licensed under the MIT License (MIT), see\n  http://jedwatson.github.io/classnames\n*/\n/* global define */\n\n(function () {\n\t'use strict';\n\n\tvar hasOwn = {}.hasOwnProperty;\n\n\tfunction classNames () {\n\t\tvar classes = [];\n\n\t\tfor (var i = 0; i < arguments.length; i++) {\n\t\t\tvar arg = arguments[i];\n\t\t\tif (!arg) continue;\n\n\t\t\tvar argType = typeof arg;\n\n\t\t\tif (argType === 'string' || argType === 'number') {\n\t\t\t\tclasses.push(arg);\n\t\t\t} else if (Array.isArray(arg) && arg.length) {\n\t\t\t\tvar inner = classNames.apply(null, arg);\n\t\t\t\tif (inner) {\n\t\t\t\t\tclasses.push(inner);\n\t\t\t\t}\n\t\t\t} else if (argType === 'object') {\n\t\t\t\tfor (var key in arg) {\n\t\t\t\t\tif (hasOwn.call(arg, key) && arg[key]) {\n\t\t\t\t\t\tclasses.push(key);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\treturn classes.join(' ');\n\t}\n\n\tif (typeof module !== 'undefined' && module.exports) {\n\t\tclassNames.default = classNames;\n\t\tmodule.exports = classNames;\n\t} else if (true) {\n\t\t// register as 'classnames', consistent with npm package name\n\t\t!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {\n\t\t\treturn classNames;\n\t\t}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),\n\t\t\t\t__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));\n\t} else {}\n}());\n\n\n//# sourceURL=webpack:///./node_modules/classnames/index.js?");

/***/ }),

/***/ "@wordpress/blocks":
/*!****************************!*\
  !*** external "wp.blocks" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.blocks;\n\n//# sourceURL=webpack:///external_%22wp.blocks%22?");

/***/ }),

/***/ "@wordpress/components":
/*!********************************!*\
  !*** external "wp.components" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.components;\n\n//# sourceURL=webpack:///external_%22wp.components%22?");

/***/ }),

/***/ "@wordpress/editor":
/*!****************************!*\
  !*** external "wp.editor" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.editor;\n\n//# sourceURL=webpack:///external_%22wp.editor%22?");

/***/ }),

/***/ "@wordpress/element":
/*!*****************************!*\
  !*** external "wp.element" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.element;\n\n//# sourceURL=webpack:///external_%22wp.element%22?");

/***/ }),

/***/ "@wordpress/i18n":
/*!**************************!*\
  !*** external "wp.i18n" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.i18n;\n\n//# sourceURL=webpack:///external_%22wp.i18n%22?");

/***/ })

/******/ })));