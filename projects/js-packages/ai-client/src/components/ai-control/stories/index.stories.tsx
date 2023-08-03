/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import { useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import { REQUESTING_STATES } from '../../../types';
import AIControl from '../index';
/**
 * Types
 */
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/AI Client/AI Control',
	component: AIControl,
	argTypes: {
		requestingState: {
			control: {
				type: 'select',
			},
			options: REQUESTING_STATES,
		},
	},
	parameters: {
		controls: {
			exclude: /on[A-Z].*/,
		},
	},
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
	requestingState: 'init',
	showButtonsLabel: true,
	showAccept: false,
	acceptLabel: 'Accept',
	onChange: action( 'onChange' ),
	onSend: action( 'onSend' ),
	onStop: action( 'onStop' ),
	onAccept: action( 'onAccept' ),
};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;
