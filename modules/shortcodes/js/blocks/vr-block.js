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
	title: __('VR'),
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
				return wp.element.createElement('iframe', {
					allowFullScreen: 'true',
					frameBorder: '0',
					width: '525',
					height: '300',
					src: "https://vr.me.sh/view/?url=" + attributes.url
				});
			}
			return wp.element.createElement(
				'div',
				null,
				wp.element.createElement(
					Placeholder,
					{
						key: 'placeholder',
						instructions: __('Enter URL to VR image'),
						icon: 'format-image',
						label: __('VR Image'),
						className: props.className
					},
					wp.element.createElement(UrlInput, {
						value: attributes.url,
						onChange: onSetUrl
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