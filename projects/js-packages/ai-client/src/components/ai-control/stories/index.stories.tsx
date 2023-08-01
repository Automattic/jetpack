/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AIControl from '../index';
/**
 * Types
 */
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/AI Client/AI Control',
	component: AIControl,
	parameters: {},
} as Meta< typeof AIControl >;

const Template = args => {
	const [ value, setValue ] = useState( '' );

	const handleChange = ( newValue: string ) => {
		setValue( newValue );
		args?.onChange?.( newValue );
	};

	return <AIControl { ...args } onChange={ handleChange } value={ args?.value ?? value } />;
};

const DefaultArgs = {
	loading: false,
	isOpaque: false,
	placeholder: '',
	showButtonsLabel: true,
	showAccept: false,
	acceptLabel: 'Accept',
};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;
