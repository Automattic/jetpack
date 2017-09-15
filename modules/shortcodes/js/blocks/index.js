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
	__webpack_require__(2);

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

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	/* global wp, _, */
	/* eslint react/react-in-jsx-scope: 0 */

	var __ = wp.i18n.__;
	var _wp$blocks = wp.blocks,
	    registerBlockType = _wp$blocks.registerBlockType,
	    UrlInput = _wp$blocks.UrlInput,
	    children = _wp$blocks.source.children;
	var Placeholder = wp.components.Placeholder;

	registerBlockType('gutenpack/vr', {
		title: __('VR Image'),
		icon: 'sort',
		category: 'layout',
		attributes: {
			url: children('url')
		},

		edit: function edit(props) {
			var attributes = props.attributes;
			var onSetUrl = function onSetUrl(value) {
				props.setAttributes({ url: value });
			};

			var renderEdit = function renderEdit() {
				if (attributes.url) {
					return wp.element.createElement('div', { className: props.className }, wp.element.createElement('iframe', {
						allowFullScreen: 'true',
						frameBorder: '0',
						width: '100%',
						height: '300',
						src: "https://vr.me.sh/view/?url=" + attributes.url
					}));
				}
				return wp.element.createElement('div', null, wp.element.createElement(Placeholder, {
					key: 'placeholder',
					instructions: __('Enter URL to VR image'),
					icon: 'format-image',
					label: __('VR Image'),
					className: props.className
				}, wp.element.createElement(UrlInput, {
					value: attributes.url,
					onChange: onSetUrl
				})));
			};

			return renderEdit();
		},
		save: function save() {
			return null;
		}
	});

/***/ }
/******/ ]);