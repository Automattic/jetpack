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

		return wp.element.createElement(
			'div',
			{ className: props.className },
			wp.element.createElement(Editable, {
				tagName: 'label',
				multiline: false,
				placeholder: __('Write visible text…'),
				value: attributes.title,
				onChange: onChangeTitle,
				focus: focusedEditable === 'title',
				onFocus: onFocusTitle
			})
		);
	},
	save: function save(props) {
		var title = props.attributes.title;

		return wp.element.createElement(
			'h4',
			null,
			title
		);
	}
});