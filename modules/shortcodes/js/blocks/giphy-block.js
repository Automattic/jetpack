'use strict';

require('whatwg-fetch');

var __ = wp.i18n.__; /* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */

/**
 * External dependencies
 */

var _wp$blocks = wp.blocks,
    registerBlockType = _wp$blocks.registerBlockType,
    children = _wp$blocks.source.children;
var Placeholder = wp.components.Placeholder;


registerBlockType('gutenpack/giphy', {
	title: __('Giphy'),
	icon: 'sort',
	category: 'layout',
	attributes: {
		s: children('s')
	},

	edit: function edit(props) {
		var attributes = props.attributes,
		    searchResults = '';

		var getParams = {
			api_key: 'c7daeb0f028c4bc294f04131e6f2d777',
			q: 'jetpack',
			limit: 25,
			offset: 0,
			rating: 'G'
		};

		// eslint-disable-next-line
		// console.log( attributes );

		var handleSearch = function handleSearch(value) {
			return fetch('https://api.giphy.com/v1/gifs/search?api_key=c7daeb0f028c4bc294f04131e6f2d777&q=jetpack&limit=1&offset=0&rating=G&lang=en', {
				method: 'GET',
				mode: 'cors'
			}).then().then(props.setAttributes({ s: value }));
		};

		var renderEdit = function renderEdit() {
			// eslint-disable-next-line
			console.log(attributes.s);
			return wp.element.createElement(
				'div',
				null,
				wp.element.createElement(
					Placeholder,
					{
						key: 'giphy/placeholder',
						instructions: __('Search for something!'),
						icon: 'format-image',
						label: __('Search for GIF'),
						className: props.className
					},
					wp.element.createElement('input', {
						type: 'search',
						value: attributes.s,
						onChange: handleSearch
					})
				)
			);
		};

		return renderEdit();
	},
	save: function save() {
		return null;
	}
});