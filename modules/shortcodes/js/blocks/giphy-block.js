'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

require('whatwg-fetch');

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __ = wp.i18n.__; /** @format */
/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */

/**
 * External dependencies
 */

var registerBlockType = wp.blocks.registerBlockType;
var _wp$components = wp.components,
    Placeholder = _wp$components.Placeholder,
    Button = _wp$components.Button,
    Dashicon = _wp$components.Dashicon;


registerBlockType('gutenpack/giphy', {
	title: __('Giphy'),
	icon: 'format-video',
	category: 'layout',
	attributes: {
		searchTerm: {
			type: 'string',
			default: ''
		},
		searchResults: {
			type: 'object',
			default: {}
		},
		chosenImage: {
			type: 'object',
			default: {}
		},
		resultGallery: {
			type: 'object',
			default: {}
		},
		className: {
			type: 'string',
			default: ''
		}
	},

	edit: function edit(props) {
		var attributes = props.attributes;

		var handleKeyDown = function handleKeyDown(e) {
			if (e.key === 'Enter') {
				handleSearch();
			}
		};

		var handleInputRef = function handleInputRef(input) {
			return input && input.focus();
		};

		var handleSearch = function handleSearch() {
			var getParams = {
				api_key: 'OpUiweD5zr2xC7BhSIuqGFfCvnz5jzHj',
				q: attributes.searchTerm,
				limit: 20,
				offset: 0,
				rating: 'G'
			};

			var esc = encodeURIComponent;
			var query = (0, _keys2['default'])(getParams).map(function (k) {
				return esc(k) + '=' + esc(getParams[k]);
			}).join('&');

			props.setAttributes({ className: 'giphy__oh-heck-yeah' });

			fetch('https://api.giphy.com/v1/gifs/search?' + query, {
				method: 'GET',
				mode: 'cors',
				cache: 'default'
			}).then(function (response) {
				return response.json();
			}).then(setGallery).then(function (response) {
				props.setAttributes({ searchResults: response.data });
			});
		};

		var setGallery = function setGallery(response) {
			var numImages = response.data.length >= 9 ? 9 : response.data.length;

			if (numImages > 0) {
				var gallery = {};
				var i = void 0;
				for (i = 0; i < numImages; i++) {
					gallery[i] = response.data[i].images.preview_gif;
				}

				// Store the result gallery
				props.setAttributes({ resultGallery: gallery });
			} else {
				// Store the result gallery
				props.setAttributes({ resultGallery: { noResults: true } });
			}

			return response;
		};

		var setSearchTerm = function setSearchTerm(event) {
			var value = event.target.value;

			// Clear the chosen image
			props.setAttributes({ chosenImage: {} });

			// Set the value
			props.setAttributes({ searchTerm: value });
		};

		var shuffleImages = function shuffleImages() {
			props.setAttributes({ resultGallery: _.shuffle(attributes.searchResults).slice(0, 6) });
		};

		var chooseImage = function chooseImage(key) {
			props.setAttributes({
				chosenImage: attributes.resultGallery[key],
				searchTerm: '',
				searchResults: {},
				resultGallery: {}
			});
		};

		var resultGallery = function resultGallery() {
			var images = attributes.resultGallery,
			    chosenImage = attributes.chosenImage,
			    gallery = [];

			if ('undefined' !== images.noResults && images.noResults) {
				return __('No results!');
			}

			if ((0, _isEmpty2['default'])(images) || !(0, _isEmpty2['default'])(chosenImage)) {
				return false;
			}

			(0, _keys2['default'])(images).map(function (key) {
				gallery.push(wp.element.createElement('img', {
					key: images[key].url,
					src: images[key].url,
					width: images[key].width,
					height: images[key].height,
					onClick: function onClick() {
						return chooseImage(key);
					},
					className: 'giphy__a-gif-has-no-name'
				}));
			});

			return gallery;
		};

		var chosenImage = attributes.chosenImage;

		return wp.element.createElement(
			'div',
			null,
			(0, _isEmpty2['default'])(chosenImage) && wp.element.createElement(
				'div',
				null,
				wp.element.createElement(
					Placeholder,
					{
						key: 'giphy/placeholder',
						instructions: __('The peak of human expression at your fingertips!'),
						icon: 'schedule',
						label: __('Search gifs'),
						className: props.className
					},
					wp.element.createElement('input', {
						id: 'giphy-input-search',
						type: 'search',
						value: attributes.searchTerm || '',
						onChange: setSearchTerm,
						onKeyDown: handleKeyDown,
						ref: handleInputRef
					}),
					wp.element.createElement(
						Button,
						{ onClick: handleSearch },
						wp.element.createElement(Dashicon, { icon: 'search' })
					),
					wp.element.createElement(
						Button,
						{ onClick: shuffleImages },
						wp.element.createElement(Dashicon, { icon: 'randomize' })
					)
				),
				wp.element.createElement(
					'div',
					{ className: 'giphy__gallery' },
					resultGallery()
				)
			),
			!(0, _isEmpty2['default'])(chosenImage) && wp.element.createElement('img', {
				src: chosenImage.url,
				width: chosenImage.width,
				height: chosenImage.height,
				className: 'giphy__chosen-one'
			})
		);
	},
	save: function save(props) {
		var chosenImage = props.attributes.chosenImage;


		return !(0, _isEmpty2['default'])(chosenImage) && wp.element.createElement(
			'div',
			{ className: 'jetpack-blocks-giphy' },
			wp.element.createElement('img', {
				src: chosenImage.url,
				width: chosenImage.width,
				height: chosenImage.height,
				className: 'giphy__chosen-one'
			})
		);
	}
});