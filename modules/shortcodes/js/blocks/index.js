/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1);

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	/* global wp, _, */
	/* eslint react/react-in-jsx-scope: 0 */

	var __ = wp.i18n.__;
	var _wp$blocks = wp.blocks,
	    registerBlockType = _wp$blocks.registerBlockType,
	    Editable = _wp$blocks.Editable,
	    children = _wp$blocks.source.children;

	registerBlockType('gutenpack/test', {
		title: __('Test'),
		icon: 'sort',
		category: 'layout',
		attributes: {
			title: children('label')
		},
		edit: function edit(props) {
			var focusedEditable = props.focus ? props.focus.editable || 'title' : null;
			var attributes = props.attributes;
			var onChangeTitle = function onChangeTitle(value) {
				props.setAttributes({ title: value });
			};
			var onFocusTitle = function onFocusTitle(focus) {
				props.setFocus(_.extend({}, focus, { editable: 'title' }));
			};

			return wp.element.createElement('div', { className: props.className }, wp.element.createElement(Editable, {
				tagName: 'label',
				multiline: false,
				placeholder: __('Write visible text…'),
				value: attributes.title,
				onChange: onChangeTitle,
				focus: focusedEditable === 'title',
				onFocus: onFocusTitle
			}));
		},
		save: function save(props) {
			var title = props.attributes.title;

			return wp.element.createElement('h4', null, title);
		}
	});

/***/ }
/******/ ]);