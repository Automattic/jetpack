/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import { useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AIControl from '../index.js';
/**
 * Types
 */
import type { Meta } from '@storybook/react';

interface AIControlStoryMeta extends Meta< typeof AIControl > {
	title?: string;
	component?: React.ReactElement;
}

const meta: AIControlStoryMeta = {
	title: 'JS Packages/AI Client/AI Control',
	component: AIControl,
	decorators: [
		Story => (
			<div style={ { backgroundColor: 'white' } }>
				<Story />
			</div>
		),
	],
	argTypes: {
		state: {
			control: {
				type: 'select',
			},
			options: [ 'init', 'requesting', 'suggesting', 'done', 'error' ],
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
	isTransparent: false,
	placeholder: '',
	state: 'init',
	showButtonLabels: true,
	showAccept: false,
	acceptLabel: 'Accept',
	onChange: action( 'onChange' ),
	onSend: action( 'onSend' ),
	onStop: action( 'onStop' ),
	onAccept: action( 'onAccept' ),
};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;

export default meta;
