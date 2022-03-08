/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import QRCode from '../index.jsx';

export default {
	title: 'JS Packages/Components/QRCode',
	component: QRCode,
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

const Template = args => <QRCode { ...args } />;

export const _default = Template.bind( {} );
