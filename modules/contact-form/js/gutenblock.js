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

/***/ "./client/gutenberg/extensions/contact-form/editor.js":
/*!************************************************************!*\
  !*** ./client/gutenberg/extensions/contact-form/editor.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ \"./node_modules/@babel/runtime/helpers/interopRequireDefault.js\");\n\nvar _assertThisInitialized2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/assertThisInitialized */ \"./node_modules/@babel/runtime/helpers/assertThisInitialized.js\"));\n\nvar _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\"));\n\nvar _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\"));\n\nvar _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/possibleConstructorReturn */ \"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js\"));\n\nvar _getPrototypeOf4 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/getPrototypeOf */ \"./node_modules/@babel/runtime/helpers/getPrototypeOf.js\"));\n\nvar _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\"));\n\nvar _components = __webpack_require__(/*! @wordpress/components */ \"@wordpress/components\");\n\nvar _blocks = __webpack_require__(/*! @wordpress/blocks */ \"@wordpress/blocks\");\n\nvar _editor = __webpack_require__(/*! @wordpress/editor */ \"@wordpress/editor\");\n\nvar _element = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n\nvar _i18n = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n\n/*global jQuery _ wp*/\n\n/** @jsx wp.element.createElement */\n\n/** @format */\n\n/**\n * External dependencies\n */\n\n/**\n * Components:\n */\nvar GrunionForm =\n/*#__PURE__*/\nfunction (_Component) {\n  (0, _inherits2.default)(GrunionForm, _Component);\n\n  function GrunionForm() {\n    (0, _classCallCheck2.default)(this, GrunionForm);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionForm).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionForm, [{\n    key: \"render\",\n    value: function render() {\n      var _this = this;\n\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(_editor.InspectorControls, null, wp.element.createElement(_components.PanelBody, {\n        title: (0, _i18n.__)('Submission Details', 'jetpack')\n      }, wp.element.createElement(_components.TextControl, {\n        label: (0, _i18n.__)('What would you like the subject of the email to be?'),\n        value: this.props.subject,\n        onChange: function onChange(x) {\n          return _this.props.setAttributes({\n            subject: x\n          });\n        }\n      }), wp.element.createElement(_components.TextControl, {\n        label: (0, _i18n.__)('Which email address should we send the submissions to?'),\n        value: this.props.to,\n        onChange: function onChange(x) {\n          return _this.props.setAttributes({\n            to: x\n          });\n        }\n      }), wp.element.createElement(_components.TextControl, {\n        label: (0, _i18n.__)('What should the label on the form’s submit button say?'),\n        value: this.props.submit_button_text ? this.props.submit_button_text : (0, _i18n.__)('Submit »'),\n        onChange: function onChange(x) {\n          return _this.props.setAttributes({\n            submit_button_text: x\n          });\n        }\n      }))), wp.element.createElement(\"div\", {\n        className: \"grunion-form\"\n      }, this.props.children, wp.element.createElement(_components.TextControl, {\n        className: \"button button-primary button-default grunion-submit-button\",\n        value: this.props.submit_button_text ? this.props.submit_button_text : (0, _i18n.__)('Submit »'),\n        onChange: function onChange(x) {\n          return _this.props.setAttributes({\n            submit_button_text: x\n          });\n        }\n      })));\n    }\n  }]);\n  return GrunionForm;\n}(_element.Component);\n\nvar GrunionFieldRequiredToggle =\n/*#__PURE__*/\nfunction (_Component2) {\n  (0, _inherits2.default)(GrunionFieldRequiredToggle, _Component2);\n\n  function GrunionFieldRequiredToggle() {\n    (0, _classCallCheck2.default)(this, GrunionFieldRequiredToggle);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionFieldRequiredToggle).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionFieldRequiredToggle, [{\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_components.ToggleControl, {\n        label: (0, _i18n.__)('Required'),\n        checked: this.props.required,\n        onChange: this.props.onChange\n      });\n    }\n  }]);\n  return GrunionFieldRequiredToggle;\n}(_element.Component);\n\nvar GrunionFieldSettings =\n/*#__PURE__*/\nfunction (_Component3) {\n  (0, _inherits2.default)(GrunionFieldSettings, _Component3);\n\n  function GrunionFieldSettings() {\n    (0, _classCallCheck2.default)(this, GrunionFieldSettings);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionFieldSettings).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionFieldSettings, [{\n    key: \"render\",\n    value: function render() {\n      var _this2 = this;\n\n      return wp.element.createElement(_editor.InspectorControls, null, wp.element.createElement(_components.PanelBody, {\n        title: (0, _i18n.__)('Field Settings', 'jetpack')\n      }, wp.element.createElement(GrunionFieldRequiredToggle, {\n        required: this.props.required,\n        onChange: function onChange(x) {\n          return _this2.props.setAttributes({\n            required: x\n          });\n        }\n      })));\n    }\n  }]);\n  return GrunionFieldSettings;\n}(_element.Component);\n\nvar GrunionFieldLabel =\n/*#__PURE__*/\nfunction (_Component4) {\n  (0, _inherits2.default)(GrunionFieldLabel, _Component4);\n\n  function GrunionFieldLabel() {\n    (0, _classCallCheck2.default)(this, GrunionFieldLabel);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionFieldLabel).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionFieldLabel, [{\n    key: \"render\",\n    value: function render() {\n      var _this3 = this;\n\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(\"input\", {\n        type: \"text\",\n        value: this.props.label,\n        className: \"grunion-field-label\",\n        onChange: function onChange(x) {\n          return _this3.props.setAttributes({\n            label: x.target.value\n          });\n        }\n      }), this.props.required && wp.element.createElement(\"span\", {\n        className: \"required\"\n      }, (0, _i18n.__)('(required)')));\n    }\n  }]);\n  return GrunionFieldLabel;\n}(_element.Component);\n\nvar GrunionField =\n/*#__PURE__*/\nfunction (_Component5) {\n  (0, _inherits2.default)(GrunionField, _Component5);\n\n  function GrunionField() {\n    (0, _classCallCheck2.default)(this, GrunionField);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionField).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionField, [{\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(GrunionFieldSettings, {\n        required: this.props.required,\n        setAttributes: this.props.setAttributes\n      }), wp.element.createElement(\"div\", {\n        className: \"grunion-field\"\n      }, wp.element.createElement(_components.TextControl, {\n        type: this.props.type,\n        label: wp.element.createElement(GrunionFieldLabel, {\n          required: this.props.required,\n          label: this.props.label,\n          setAttributes: this.props.setAttributes\n        }),\n        disabled: true\n      })));\n    }\n  }]);\n  return GrunionField;\n}(_element.Component);\n\nvar GrunionFieldTextarea =\n/*#__PURE__*/\nfunction (_Component6) {\n  (0, _inherits2.default)(GrunionFieldTextarea, _Component6);\n\n  function GrunionFieldTextarea() {\n    (0, _classCallCheck2.default)(this, GrunionFieldTextarea);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionFieldTextarea).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionFieldTextarea, [{\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(GrunionFieldSettings, {\n        required: this.props.required,\n        setAttributes: this.props.setAttributes\n      }), wp.element.createElement(\"div\", {\n        className: \"grunion-field\"\n      }, wp.element.createElement(_components.TextareaControl, {\n        label: wp.element.createElement(GrunionFieldLabel, {\n          required: this.props.required,\n          label: this.props.label,\n          setAttributes: this.props.setAttributes\n        }),\n        disabled: true\n      })));\n    }\n  }]);\n  return GrunionFieldTextarea;\n}(_element.Component);\n\nvar GrunionFieldCheckbox =\n/*#__PURE__*/\nfunction (_Component7) {\n  (0, _inherits2.default)(GrunionFieldCheckbox, _Component7);\n\n  function GrunionFieldCheckbox() {\n    (0, _classCallCheck2.default)(this, GrunionFieldCheckbox);\n    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf4.default)(GrunionFieldCheckbox).apply(this, arguments));\n  }\n\n  (0, _createClass2.default)(GrunionFieldCheckbox, [{\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(GrunionFieldSettings, {\n        required: this.props.required,\n        setAttributes: this.props.setAttributes\n      }), wp.element.createElement(\"div\", {\n        className: \"grunion-field\"\n      }, wp.element.createElement(_components.CheckboxControl, {\n        label: wp.element.createElement(GrunionFieldLabel, {\n          required: this.props.required,\n          label: this.props.label,\n          setAttributes: this.props.setAttributes\n        }),\n        disabled: true\n      })));\n    }\n  }]);\n  return GrunionFieldCheckbox;\n}(_element.Component);\n\nvar GrunionFieldMultiple =\n/*#__PURE__*/\nfunction (_Component8) {\n  (0, _inherits2.default)(GrunionFieldMultiple, _Component8);\n\n  function GrunionFieldMultiple() {\n    var _getPrototypeOf2;\n\n    var _this4;\n\n    (0, _classCallCheck2.default)(this, GrunionFieldMultiple);\n\n    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    _this4 = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf4.default)(GrunionFieldMultiple)).call.apply(_getPrototypeOf2, [this].concat(args)));\n    _this4.onChangeOption = _this4.onChangeOption.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this4)));\n    return _this4;\n  }\n\n  (0, _createClass2.default)(GrunionFieldMultiple, [{\n    key: \"onChangeOption\",\n    value: function onChangeOption(key) {\n      var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;\n\n      var newOptions = _.clone(this.props.options);\n\n      if (null === option) {\n        newOptions.splice(key, 1);\n      } else {\n        newOptions.splice(key, 1, option);\n      }\n\n      this.props.setAttributes({\n        options: newOptions\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this5 = this;\n\n      return wp.element.createElement(_element.Fragment, null, wp.element.createElement(GrunionFieldSettings, {\n        required: this.props.required,\n        setAttributes: this.props.setAttributes\n      }), wp.element.createElement(\"div\", {\n        className: \"grunion-field\"\n      }, wp.element.createElement(GrunionFieldLabel, {\n        required: this.props.required,\n        label: this.props.label,\n        setAttributes: this.props.setAttributes\n      }), wp.element.createElement(\"ol\", null, _.map(this.props.options, function (option, index) {\n        return wp.element.createElement(GrunionOption, {\n          key: index,\n          option: option,\n          index: index,\n          onChangeOption: _this5.onChangeOption\n        });\n      })), wp.element.createElement(_components.IconButton, {\n        icon: \"insert\",\n        label: (0, _i18n.__)('Insert option'),\n        onClick: function onClick() {\n          return _this5.props.setAttributes({\n            options: _this5.props.options.concat([''])\n          });\n        }\n      }, \" \", (0, _i18n.__)('Add'))));\n    }\n  }]);\n  return GrunionFieldMultiple;\n}(_element.Component);\n\nvar GrunionOption =\n/*#__PURE__*/\nfunction (_Component9) {\n  (0, _inherits2.default)(GrunionOption, _Component9);\n\n  function GrunionOption() {\n    var _getPrototypeOf3;\n\n    var _this6;\n\n    (0, _classCallCheck2.default)(this, GrunionOption);\n\n    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {\n      args[_key2] = arguments[_key2];\n    }\n\n    _this6 = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf3 = (0, _getPrototypeOf4.default)(GrunionOption)).call.apply(_getPrototypeOf3, [this].concat(args)));\n    _this6.onChangeOption = _this6.onChangeOption.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this6)));\n    _this6.onDeleteOption = _this6.onDeleteOption.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this6)));\n    return _this6;\n  }\n\n  (0, _createClass2.default)(GrunionOption, [{\n    key: \"onChangeOption\",\n    value: function onChangeOption(x) {\n      this.props.onChangeOption(this.props.index, x.target.value);\n    }\n  }, {\n    key: \"onDeleteOption\",\n    value: function onDeleteOption() {\n      this.props.onChangeOption(this.props.index);\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      return wp.element.createElement(\"li\", null, wp.element.createElement(\"input\", {\n        type: \"text\",\n        className: \"option\",\n        value: this.props.option,\n        placeholder: (0, _i18n.__)('Enter your option value here…'),\n        onChange: this.onChangeOption\n      }), wp.element.createElement(_components.IconButton, {\n        icon: \"no\",\n        label: (0, _i18n.__)('Remove option'),\n        onClick: this.onDeleteOption\n      }));\n    }\n  }]);\n  return GrunionOption;\n}(_element.Component);\n/**\n * Block Registrations:\n */\n\n\n(0, _blocks.registerBlockType)('grunion/form', {\n  title: (0, _i18n.__)('Contact Form', 'jetpack'),\n  icon: 'feedback',\n  category: 'widgets',\n  supports: {\n    html: false\n  },\n\n  /* // not yet ready for prime time.\n  transforms: {\n  \tfrom: [\n  \t\t{\n  \t\t\ttype: 'shortcode',\n  \t\t\ttag: 'contact-form',\n  \t\t\tattributes: {\n  \t\t\t\tsubject: {\n  \t\t\t\t\ttype: 'string',\n  \t\t\t\t\tshortcode: function( named ) {\n  \t\t\t\t\t\treturn named.subject;\n  \t\t\t\t\t},\n  \t\t\t\t},\n  \t\t\t\tto: {\n  \t\t\t\t\ttype: 'string',\n  \t\t\t\t\tshortcode: function( named ) {\n  \t\t\t\t\t\treturn named.to;\n  \t\t\t\t\t},\n  \t\t\t\t},\n  \t\t\t\tsubmit_button_text: {\n  \t\t\t\t\ttype: 'string',\n  \t\t\t\t\tshortcode: function( named ) {\n  \t\t\t\t\t\treturn named.submit_button_text;\n  \t\t\t\t\t},\n  \t\t\t\t},\n  \t\t\t}\n  \t\t\t}\n  \t]\n  },\n  */\n  attributes: {\n    subject: {\n      type: 'string',\n      'default': null\n    },\n    to: {\n      type: 'string',\n      'default': null\n    },\n    submit_button_text: {\n      type: 'string',\n      'default': (0, _i18n.__)('Submit »')\n    }\n  },\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionForm, {\n      key: \"grunion/form\",\n      className: props.className,\n      subject: props.attributes.subject,\n      to: props.attributes.to,\n      submit_button_text: props.attributes.submit_button_text,\n      setAttributes: props.setAttributes\n    }, wp.element.createElement(_editor.InnerBlocks, {\n      allowedBlocks: [],\n      templateLock: false,\n      template: [['grunion/field-name', {\n        label: (0, _i18n.__)('Name')\n      }], ['grunion/field-email', {\n        label: (0, _i18n.__)('Email')\n      }], ['grunion/field-text', {\n        label: (0, _i18n.__)('Subject')\n      }], ['grunion/field-textarea', {\n        label: (0, _i18n.__)('Message')\n      }]]\n    }));\n  },\n  save: function save() {\n    return wp.element.createElement(_editor.InnerBlocks.Content, null);\n  }\n});\nvar FieldDefaults = {\n  icon: 'feedback',\n  category: 'common',\n  parent: ['grunion/form'],\n  supports: {\n    html: false\n  },\n  attributes: {\n    label: {\n      type: 'string',\n      'default': (0, _i18n.__)('Type here...')\n    },\n    required: {\n      type: 'boolean',\n      'default': false\n    },\n    options: {\n      type: 'array',\n      'default': []\n    }\n  },\n  transforms: {\n    to: [{\n      type: 'block',\n      blocks: ['grunion/field-text'],\n      isMatch: function isMatch(_ref) {\n        var options = _ref.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-text', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-name'],\n      isMatch: function isMatch(_ref2) {\n        var options = _ref2.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-name', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-email'],\n      isMatch: function isMatch(_ref3) {\n        var options = _ref3.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-email', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-url'],\n      isMatch: function isMatch(_ref4) {\n        var options = _ref4.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-url', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-date'],\n      isMatch: function isMatch(_ref5) {\n        var options = _ref5.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-date', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-telephone'],\n      isMatch: function isMatch(_ref6) {\n        var options = _ref6.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-telephone', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-textarea'],\n      isMatch: function isMatch(_ref7) {\n        var options = _ref7.options;\n        return !options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-textarea', attributes);\n      }\n    },\n    /* // not yet ready for prime time.\n    {\n    \ttype: 'block',\n    \tblocks: [ 'grunion/field-checkbox' ],\n    \tisMatch: ( { options } ) => 1 === options.length,\n    \ttransform: ( attributes )=>createBlock( 'grunion/field-checkbox', attributes )\n    },\n    */\n    {\n      type: 'block',\n      blocks: ['grunion/field-checkbox-multiple'],\n      isMatch: function isMatch(_ref8) {\n        var options = _ref8.options;\n        return 1 <= options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-checkbox-multiple', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-radio'],\n      isMatch: function isMatch(_ref9) {\n        var options = _ref9.options;\n        return 1 <= options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-radio', attributes);\n      }\n    }, {\n      type: 'block',\n      blocks: ['grunion/field-select'],\n      isMatch: function isMatch(_ref10) {\n        var options = _ref10.options;\n        return 1 <= options.length;\n      },\n      transform: function transform(attributes) {\n        return (0, _blocks.createBlock)('grunion/field-select', attributes);\n      }\n    }]\n  },\n  save: function save() {\n    return null;\n  }\n};\n(0, _blocks.registerBlockType)('grunion/field-text', _.defaults({\n  title: (0, _i18n.__)('Text', 'jetpack'),\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionField, {\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-name', _.defaults({\n  title: (0, _i18n.__)('Name', 'jetpack'),\n  icon: 'admin-users',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionField, {\n      type: \"text\",\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-email', _.defaults({\n  title: (0, _i18n.__)('Email', 'jetpack'),\n  icon: 'email',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionField, {\n      type: \"email\",\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-url', _.defaults({\n  title: (0, _i18n.__)('URL', 'jetpack'),\n  icon: 'share-alt2',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionField, {\n      type: \"url\",\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-date', _.defaults({\n  title: (0, _i18n.__)('Date', 'jetpack'),\n  icon: 'calendar-alt',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionField, {\n      type: \"text\",\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-telephone', _.defaults({\n  title: (0, _i18n.__)('Telephone', 'jetpack'),\n  icon: 'phone',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionField, {\n      type: \"tel\",\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-textarea', _.defaults({\n  title: (0, _i18n.__)('Textarea', 'jetpack'),\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionFieldTextarea, {\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-checkbox', _.defaults({\n  title: (0, _i18n.__)('Checkbox', 'jetpack'),\n  icon: 'forms',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionFieldCheckbox, {\n      label: props.attributes.label,\n      required: props.attributes.required,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-checkbox-multiple', _.defaults({\n  title: (0, _i18n.__)('Checkbox Multiple', 'jetpack'),\n  icon: 'forms',\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionFieldMultiple, {\n      required: props.attributes.required,\n      label: props.attributes.label,\n      options: props.attributes.options,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-radio', _.defaults({\n  title: (0, _i18n.__)('Radio', 'jetpack'),\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionFieldMultiple, {\n      required: props.attributes.required,\n      label: props.attributes.label,\n      options: props.attributes.options,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n(0, _blocks.registerBlockType)('grunion/field-select', _.defaults({\n  title: (0, _i18n.__)('Select', 'jetpack'),\n  edit: function edit(props) {\n    return wp.element.createElement(GrunionFieldMultiple, {\n      required: props.attributes.required,\n      label: props.attributes.label,\n      options: props.attributes.options,\n      setAttributes: props.setAttributes\n    });\n  }\n}, FieldDefaults));\n\n//# sourceURL=webpack:///./client/gutenberg/extensions/contact-form/editor.js?");

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