/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import QRPost from '../index.jsx';

export default {
	title: 'JS Packages/Components/Block Editor QR Post',
	component: QRPost,
	argTypes: {
		value: {
			control: { type: 'text' },
		},
		size: {
			control: { type: 'number' },
		},
		level: {
			control: { type: 'select', options: [ 'L', 'M', 'Q', 'H' ] },
		},
		fgColor: {
			control: { type: 'color' },
		},
		bgColor: {
			control: { type: 'color' },
		},
		renderAs: {
			control: { type: 'select', options: [ 'canvas', 'svg' ] },
		},
	},
};

const Template = args => <QRPost { ...args } />;

const DefaultArgs = {};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
