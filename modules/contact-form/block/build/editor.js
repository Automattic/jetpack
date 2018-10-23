(function(e, a) { for(var i in a) e[i] = a[i]; }(window, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
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
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./client/gutenberg/extensions/contact-form/editor.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackField.jsx":
/*!******************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackField.jsx ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _JetpackFieldSettings = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldSettings */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx\"));\n\nvar _JetpackFieldLabel = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldLabel */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx\"));\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nfunction JetpackField(props) {\n  return wp.element.createElement(_element.Fragment, null, wp.element.createElement(_JetpackFieldSettings.default, {\n    required: props.required,\n    setAttributes: props.setAttributes\n  }), wp.element.createElement(\"div\", {\n    className: \"jetpack-field\"\n  }, wp.element.createElement(_components.TextControl, {\n    type: props.type,\n    label: wp.element.createElement(_JetpackFieldLabel.default, {\n      required: props.required,\n      label: props.label,\n      setAttributes: props.setAttributes\n    }),\n    disabled: true\n  })));\n}\n\nvar _default = JetpackField;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackField.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackFieldCheckbox.jsx":
/*!**************************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackFieldCheckbox.jsx ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _compose = __webpack_require__(/*! @wordpress/compose */ \"@wordpress/compose\");\n\nvar _JetpackFieldSettings = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldSettings */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx\"));\n\nvar _JetpackFieldLabel = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldLabel */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx\"));\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nfunction JetpackFieldCheckbox(props) {\n  return wp.element.createElement(_element.Fragment, null, wp.element.createElement(_JetpackFieldSettings.default, {\n    required: props.required,\n    setAttributes: props.setAttributes\n  }), wp.element.createElement(_components.BaseControl, {\n    id: \"jetpack-field-checkbox-\" + props.instanceId,\n    className: \"jetpack-field\"\n  }, wp.element.createElement(_components.CheckboxControl, {\n    id: \"jetpack-field-checkbox-\" + props.instanceId,\n    label: wp.element.createElement(_JetpackFieldLabel.default, {\n      required: props.required,\n      label: props.label,\n      setAttributes: props.setAttributes\n    }),\n    disabled: true\n  })));\n}\n\nvar _default = (0, _compose.withInstanceId)(JetpackFieldCheckbox);\n\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackFieldCheckbox.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx":
/*!***********************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf3 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\nvar JetpackFieldLabel =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(JetpackFieldLabel, _Component);\n\n  function JetpackFieldLabel() {\n    var _getPrototypeOf2;\n\n    var _this;\n\n    (0, _classCallCheck2.default)(this, JetpackFieldLabel);\n\n    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(JetpackFieldLabel)).call.apply(_getPrototypeOf2, [this].concat(args)));\n    _this.onChangeLabel = _this.onChangeLabel.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    return _this;\n  }\n\n  (0, _createClass2.default)(JetpackFieldLabel, [{\n    key: \"onChangeLabel\",\n    value: function onChangeLabel(event) {\n      this.props.setAttributes({\n        label: event.target.value\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(\"input\", {\n        type: \"text\",\n        value: this.props.label,\n        className: \"jetpack-field-label\",\n        onChange: this.onChangeLabel,\n        placeholder: (0, _i18n.__)('Type here…', 'jetpack')\n      }), this.props.required && wp.element.createElement(\"span\", {\n        className: \"required\"\n      }, (0, _i18n.__)('(required)', 'jetpack')));\n    }\n  }]);\n  return JetpackFieldLabel;\n}(_element.Component);\n\nvar _default = JetpackFieldLabel;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackFieldMultiple.jsx":
/*!**************************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackFieldMultiple.jsx ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _typeof2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/typeof */ \"./node_modules/@babel/runtime/helpers/typeof.js\"));\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf3 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _compose = __webpack_require__(/*! @wordpress/compose */ \"@wordpress/compose\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\nvar _JetpackFieldSettings = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldSettings */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx\"));\n\nvar _JetpackFieldLabel = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldLabel */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx\"));\n\nvar _JetpackOption = _interopRequireDefault(__webpack_require__(/*! ./JetpackOption */ \"./client/gutenberg/extensions/contact-form/components/JetpackOption.jsx\"));\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nvar JetpackFieldMultiple =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(JetpackFieldMultiple, _Component);\n\n  function JetpackFieldMultiple() {\n    var _getPrototypeOf2;\n\n    var _this;\n\n    (0, _classCallCheck2.default)(this, JetpackFieldMultiple);\n\n    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(JetpackFieldMultiple)).call.apply(_getPrototypeOf2, [this].concat(args)));\n    _this.onChangeOption = _this.onChangeOption.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    return _this;\n  }\n\n  (0, _createClass2.default)(JetpackFieldMultiple, [{\n    key: \"onChangeOption\",\n    value: function onChangeOption() {\n      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;\n      var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;\n      var newOptions = this.props.options.slice(0);\n\n      if ('object' === (0, _typeof2.default)(key)) {\n        newOptions.push('');\n      } else if (null === option) {\n        newOptions.splice(key, 1);\n      } else {\n        newOptions.splice(key, 1, option);\n      }\n\n      this.props.setAttributes({\n        options: newOptions\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this2 = this;\n\n      this.type = this.props.type;\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(_JetpackFieldSettings.default, {\n        required: this.props.required,\n        setAttributes: this.props.setAttributes\n      }), wp.element.createElement(_components.BaseControl, {\n        id: \"jetpack-field-multiple-\" + this.props.instanceId,\n        className: \"jetpack-field\",\n        label: wp.element.createElement(_JetpackFieldLabel.default, {\n          required: this.props.required,\n          label: this.props.label,\n          setAttributes: this.props.setAttributes\n        })\n      }, wp.element.createElement(\"ol\", {\n        id: \"jetpack-field-multiple-\" + this.props.instanceId\n      }, this.props.options.map(function (option, index) {\n        return wp.element.createElement(_JetpackOption.default, {\n          type: _this2.type,\n          key: index,\n          option: option,\n          index: index,\n          onChangeOption: _this2.onChangeOption\n        });\n      })), wp.element.createElement(_components.IconButton, {\n        icon: \"insert\",\n        label: (0, _i18n.__)('Insert option', 'jetpack'),\n        onClick: this.onChangeOption\n      }, \" \", (0, _i18n.__)('Add', 'jetpack'))));\n    }\n  }]);\n  return JetpackFieldMultiple;\n}(_element.Component);\n\nvar _default = (0, _compose.withInstanceId)(JetpackFieldMultiple);\n\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackFieldMultiple.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackFieldRequiredToggle.jsx":
/*!********************************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackFieldRequiredToggle.jsx ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\nfunction JetpackFieldRequiredToggle(props) {\n  return wp.element.createElement(_components.ToggleControl, {\n    label: (0, _i18n.__)('Required', 'jetpack'),\n    checked: props.required,\n    onChange: props.onChange\n  });\n}\n\nvar _default = JetpackFieldRequiredToggle;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackFieldRequiredToggle.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx":
/*!**************************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf3 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\nvar _JetpackFieldRequiredToggle = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldRequiredToggle */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldRequiredToggle.jsx\"));\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nvar JetpackFieldSettings =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(JetpackFieldSettings, _Component);\n\n  function JetpackFieldSettings() {\n    var _getPrototypeOf2;\n\n    var _this;\n\n    (0, _classCallCheck2.default)(this, JetpackFieldSettings);\n\n    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(JetpackFieldSettings)).call.apply(_getPrototypeOf2, [this].concat(args)));\n    _this.onChangeRequired = _this.onChangeRequired.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    return _this;\n  }\n\n  (0, _createClass2.default)(JetpackFieldSettings, [{\n    key: \"onChangeRequired\",\n    value: function onChangeRequired(required) {\n      this.props.setAttributes({\n        required: required\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_editor.InspectorControls, null, wp.element.createElement(_components.PanelBody, {\n        title: (0, _i18n.__)('Field Settings', 'jetpack')\n      }, wp.element.createElement(_JetpackFieldRequiredToggle.default, {\n        required: this.props.required,\n        onChange: this.onChangeRequired\n      })));\n    }\n  }]);\n  return JetpackFieldSettings;\n}(_element.Component);\n\nvar _default = JetpackFieldSettings;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackFieldTextarea.jsx":
/*!**************************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackFieldTextarea.jsx ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _JetpackFieldSettings = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldSettings */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldSettings.jsx\"));\n\nvar _JetpackFieldLabel = _interopRequireDefault(__webpack_require__(/*! ./JetpackFieldLabel */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldLabel.jsx\"));\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\nfunction JetpackFieldTextarea(props) {\n  return wp.element.createElement(_element.Fragment, null, wp.element.createElement(_JetpackFieldSettings.default, {\n    required: props.required,\n    setAttributes: props.setAttributes\n  }), wp.element.createElement(\"div\", {\n    className: \"jetpack-field\"\n  }, wp.element.createElement(_components.TextareaControl, {\n    label: wp.element.createElement(_JetpackFieldLabel.default, {\n      required: props.required,\n      label: props.label,\n      setAttributes: props.setAttributes\n    }),\n    disabled: true\n  })));\n}\n\nvar _default = JetpackFieldTextarea;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackFieldTextarea.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackForm.jsx":
/*!*****************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackForm.jsx ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf3 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\nvar JetpackForm =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(JetpackForm, _Component);\n\n  function JetpackForm() {\n    var _getPrototypeOf2;\n\n    var _this;\n\n    (0, _classCallCheck2.default)(this, JetpackForm);\n\n    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(JetpackForm)).call.apply(_getPrototypeOf2, [this].concat(args)));\n    _this.onChangeSubject = _this.onChangeSubject.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.onChangeTo = _this.onChangeTo.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.onChangeSubmit = _this.onChangeSubmit.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.onInputSubmit = _this.onInputSubmit.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    return _this;\n  }\n\n  (0, _createClass2.default)(JetpackForm, [{\n    key: \"onChangeSubject\",\n    value: function onChangeSubject(subject) {\n      this.props.setAttributes({\n        subject: subject\n      });\n    }\n  }, {\n    key: \"onChangeTo\",\n    value: function onChangeTo(to) {\n      this.props.setAttributes({\n        to: to\n      });\n    }\n  }, {\n    key: \"onChangeSubmit\",\n    value: function onChangeSubmit(submit_button_text) {\n      this.props.setAttributes({\n        submit_button_text: submit_button_text\n      });\n    }\n  }, {\n    key: \"onInputSubmit\",\n    value: function onInputSubmit(event) {\n      this.props.setAttributes({\n        submit_button_text: event.target.innerText\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(_editor.InspectorControls, null, wp.element.createElement(_components.PanelBody, {\n        title: (0, _i18n.__)('Submission Details', 'jetpack')\n      }, wp.element.createElement(_components.TextControl, {\n        label: (0, _i18n.__)('What would you like the subject of the email to be?', 'jetpack'),\n        value: this.props.subject,\n        onChange: this.onChangeSubject\n      }), wp.element.createElement(_components.TextControl, {\n        label: (0, _i18n.__)('Which email address should we send the submissions to?', 'jetpack'),\n        value: this.props.to,\n        onChange: this.onChangeTo\n      }), wp.element.createElement(_components.TextControl, {\n        label: (0, _i18n.__)('What should the label on the form’s submit button say?', 'jetpack'),\n        value: this.props.submit_button_text,\n        placeholder: (0, _i18n.__)('Submit', 'jetpack'),\n        onChange: this.onChangeSubmit\n      }))), wp.element.createElement(\"div\", {\n        className: this.props.className + ' jetpack-form'\n      }, this.props.children, wp.element.createElement(\"div\", {\n        className: \"button button-primary button-default jetpack-submit-button\",\n        contentEditable: true,\n        suppressContentEditableWarning: true,\n        onInput: this.onInputSubmit\n      }, this.props.submit_button_text ? this.props.submit_button_text : (0, _i18n.__)('Submit', 'jetpack'))));\n    }\n  }]);\n  return JetpackForm;\n}(_element.Component);\n\nvar _default = JetpackForm;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackForm.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/components/JetpackOption.jsx":
/*!*******************************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/components/JetpackOption.jsx ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.default = void 0;\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf3 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\nvar JetpackOption =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(JetpackOption, _Component);\n\n  function JetpackOption() {\n    var _getPrototypeOf2;\n\n    var _this;\n\n    (0, _classCallCheck2.default)(this, JetpackOption);\n\n    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(JetpackOption)).call.apply(_getPrototypeOf2, [this].concat(args)));\n    _this.onChangeOption = _this.onChangeOption.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    _this.onDeleteOption = _this.onDeleteOption.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));\n    return _this;\n  }\n\n  (0, _createClass2.default)(JetpackOption, [{\n    key: \"onChangeOption\",\n    value: function onChangeOption(event) {\n      this.props.onChangeOption(this.props.index, event.target.value);\n    }\n  }, {\n    key: \"onDeleteOption\",\n    value: function onDeleteOption() {\n      this.props.onChangeOption(this.props.index);\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(\"li\", null, this.props.type && wp.element.createElement(\"input\", {\n        type: this.props.type,\n        disabled: true\n      }), wp.element.createElement(\"input\", {\n        type: \"text\",\n        className: \"option\",\n        value: this.props.option,\n        placeholder: (0, _i18n.__)('Enter your option value here…', 'jetpack'),\n        onChange: this.onChangeOption\n      }), wp.element.createElement(_components.IconButton, {\n        icon: \"no\",\n        label: (0, _i18n.__)('Remove option', 'jetpack'),\n        onClick: this.onDeleteOption\n      }));\n    }\n  }]);\n  return JetpackOption;\n}(_element.Component);\n\nvar _default = JetpackOption;\nexports.default = _default;\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/components/JetpackOption.jsx?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/editor.js":
/*!************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/editor.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n__webpack_require__(/*! ./editor.scss */ \"./client/gutenberg/extensions/contact-form/editor.scss\");\n\nvar _JetpackForm = _interopRequireDefault(__webpack_require__(/*! ./components/JetpackForm */ \"./client/gutenberg/extensions/contact-form/components/JetpackForm.jsx\"));\n\nvar _JetpackField = _interopRequireDefault(__webpack_require__(/*! ./components/JetpackField */ \"./client/gutenberg/extensions/contact-form/components/JetpackField.jsx\"));\n\nvar _JetpackFieldTextarea = _interopRequireDefault(__webpack_require__(/*! ./components/JetpackFieldTextarea */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldTextarea.jsx\"));\n\nvar _JetpackFieldCheckbox = _interopRequireDefault(__webpack_require__(/*! ./components/JetpackFieldCheckbox */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldCheckbox.jsx\"));\n\nvar _JetpackFieldMultiple = _interopRequireDefault(__webpack_require__(/*! ./components/JetpackFieldMultiple */ \"./client/gutenberg/extensions/contact-form/components/JetpackFieldMultiple.jsx\"));\n\n/*global wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Internal dependencies\n */\n\n/**\n * Block Registrations:\n */\n(0, _blocks.registerBlockType)('jetpack/form', {\n  title: (0, _i18n.__)('Contact Form', 'jetpack'),\n  icon: 'feedback',\n  category: 'widgets',\n  supports: {\n    html: false\n  },\n\n  /* // not yet ready for prime time.\n  transforms: {\n  \tfrom: [\n  \t\t{\n  \t\t\ttype: 'shortcode',\n  \t\t\ttag: 'contact-form',\n  \t\t\tattributes: {\n  \t\t\t\tsubject: {\n  \t\t\t\t\ttype: 'string',\n  \t\t\t\t\tshortcode: function( named ) {\n  \t\t\t\t\t\treturn named.subject;\n  \t\t\t\t\t},\n  \t\t\t\t},\n  \t\t\t\tto: {\n  \t\t\t\t\ttype: 'string',\n  \t\t\t\t\tshortcode: function( named ) {\n  \t\t\t\t\t\treturn named.to;\n  \t\t\t\t\t},\n  \t\t\t\t},\n  \t\t\t\tsubmit_button_text: {\n  \t\t\t\t\ttype: 'string',\n  \t\t\t\t\tshortcode: function( named ) {\n  \t\t\t\t\t\treturn named.submit_button_text;\n  \t\t\t\t\t},\n  \t\t\t\t},\n  \t\t\t}\n  \t\t\t}\n  \t]\n  },\n  */\n  attributes: {\n    subject: {\n      type: 'string',\n      'default': null\n    },\n    to: {\n      type: 'string',\n      'default': null\n    },\n    submit_button_text: {\n      type: 'string',\n      'default': (0, _i18n.__)('Submit', 'jetpack')\n    }\n  },\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackForm.default, {\n      key: \"jetpack/form\",\n      className: props.className,\n      subject: props.attributes.subject,\n      to: props.attributes.to,\n      submit_button_text: props.attributes.submit_button_text,\n      setAttributes: props.setAttributes\n    }, wp.element.createElement(_editor.InnerBlocks, {\n      allowedBlocks: [],\n      templateLock: false,\n      template: [['jetpack/field-name', {\n        label: (0, _i18n.__)('Name', 'jetpack')\n      }], ['jetpack/field-email', {\n        label: (0, _i18n.__)('Email', 'jetpack')\n      }], ['jetpack/field-text', {\n        label: (0, _i18n.__)('Subject', 'jetpack')\n      }], ['jetpack/field-textarea', {\n        label: (0, _i18n.__)('Message', 'jetpack')\n      }]]\n    }));\n  },\n  save: function save() {\n    return wp.element.createElement(_editor.InnerBlocks.Content, null);\n  }\n});\nvar FieldDefaults = {\n  category: 'common',\n  parent: ['jetpack/form'],\n  supports: {\n    html: false\n  },\n  attributes: {\n    label: {\n      type: 'string',\n      'default': null\n    },\n    required: {\n      type: 'boolean',\n      'default': false\n    },\n    options: {\n      type: 'array',\n      'default': []\n    }\n  },\n  transforms: {\n    to: [{\n      type: 'block',\n      blocks: ['jetpack/field-text'],\n      isMatch: function isMatch(_ref) {\n        var options = _ref.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-text', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-name'],\n      isMatch: function isMatch(_ref2) {\n        var options = _ref2.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-name', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-email'],\n      isMatch: function isMatch(_ref3) {\n        var options = _ref3.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-email', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-url'],\n      isMatch: function isMatch(_ref4) {\n        var options = _ref4.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-url', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-date'],\n      isMatch: function isMatch(_ref5) {\n        var options = _ref5.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-date', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-telephone'],\n      isMatch: function isMatch(_ref6) {\n        var options = _ref6.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-telephone', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-textarea'],\n      isMatch: function isMatch(_ref7) {\n        var options = _ref7.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-textarea', attributes);\n      }\n    },\n    /* // not yet ready for prime time.\n    {\n    \ttype: 'block',\n    \tblocks: [ 'jetpack/field-checkbox' ],\n    \tisMatch: ( { options } ) => 1 === options.length,\n    \ttransform: ( attributes )=>createBlock( 'jetpack/field-checkbox', attributes )\n    },\n    */\n    {\n      type: 'block',\n      blocks: ['jetpack/field-checkbox-multiple'],\n      isMatch: function isMatch(_ref8) {\n        var options = _ref8.options;\n        return 1 <= options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-checkbox-multiple', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-radio'],\n      isMatch: function isMatch(_ref9) {\n        var options = _ref9.options;\n        return 1 <= options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-radio', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['jetpack/field-select'],\n      isMatch: function isMatch(_ref10) {\n        var options = _ref10.options;\n        return 1 <= options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('jetpack/field-select', attributes);\n      }\n    }]\n  },\n  save: function save() {\n    return null;\n  }\n};\n\nvar getFieldLabel = function getFieldLabel(props) {\n  if (null === props.attributes.label) {\n    return (0, _blocks.getBlockType)(props.name).title;\n  }\n\n  return props.attributes.label;\n};\n\n(0, _blocks.registerBlockType)('jetpack/field-text', Object.assign({\n  title: (0, _i18n.__)('Text', 'jetpack'),\n  icon: 'feedback',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackField.default, {\n      type: \"text\",\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-name', Object.assign({\n  title: (0, _i18n.__)('Name', 'jetpack'),\n  icon: 'admin-users',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackField.default, {\n      type: \"text\",\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-email', Object.assign({\n  title: (0, _i18n.__)('Email', 'jetpack'),\n  icon: 'email',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackField.default, {\n      type: \"email\",\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-url', Object.assign({\n  title: (0, _i18n.__)('URL', 'jetpack'),\n  icon: 'share-alt2',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackField.default, {\n      type: \"url\",\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-date', Object.assign({\n  title: (0, _i18n.__)('Date', 'jetpack'),\n  icon: 'calendar-alt',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackField.default, {\n      type: \"text\",\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-telephone', Object.assign({\n  title: (0, _i18n.__)('Telephone', 'jetpack'),\n  icon: 'phone',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackField.default, {\n      type: \"tel\",\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-textarea', Object.assign({\n  title: (0, _i18n.__)('Textarea', 'jetpack'),\n  icon: 'feedback',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackFieldTextarea.default, {\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-checkbox', Object.assign({\n  title: (0, _i18n.__)('Checkbox', 'jetpack'),\n  icon: 'forms',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackFieldCheckbox.default, {\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-checkbox-multiple', Object.assign({\n  title: (0, _i18n.__)('Checkbox Multiple', 'jetpack'),\n  icon: 'forms',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackFieldMultiple.default, {\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      options: props.attributes.options,\n      setAttributes: props.setAttributes,\n      type: \"checkbox\"\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-radio', Object.assign({\n  title: (0, _i18n.__)('Radio', 'jetpack'),\n  icon: 'feedback',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackFieldMultiple.default, {\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      options: props.attributes.options,\n      setAttributes: props.setAttributes,\n      type: \"radio\"\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('jetpack/field-select', Object.assign({\n  title: (0, _i18n.__)('Select', 'jetpack'),\n  icon: 'feedback',\n  edit: function edit(props) {\n    return wp.element.createElement(_JetpackFieldMultiple.default, {\n      label: getFieldLabel(props),\n      required: props.attributes.required,\n      options: props.attributes.options,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/editor.js?");

/***/ }),

/***/ "./client/gutenberg/extensions/contact-form/editor.scss":
/*!**************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/editor.scss ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/editor.scss?");

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

/***/ "@wordpress/compose":
/*!*****************************!*\
  !*** external "wp.compose" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = wp.compose;\n\n//# sourceURL=webpack:///external_%22wp.compose%22?");

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