/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import { Button, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import { GuidelineMessage, ErrorMessage, UpgradeMessage } from '../../message/index.js';
import { AIControl } from '../index.js';

export default {
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
		message: {
			control: {
				type: 'select',
			},
			options: [ 'None', 'Guideline message', 'Error message', 'Upgrade message' ],
			mapping: {
				None: null,
				'Guideline message': <GuidelineMessage />,
				'Error message': <ErrorMessage onTryAgainClick={ action( 'onTryAgainClick' ) } />,
				'Upgrade message': (
					<UpgradeMessage requestsRemaining={ 10 } onUpgradeClick={ action( 'onUpgradeClick' ) } />
				),
			},
		},
		actions: {
			control: {
				type: 'select',
			},
			options: [ 'None', 'Accept button' ],
			mapping: {
				None: null,
				'Accept button': <Button>Accept</Button>,
			},
		},
		error: {
			control: {
				type: 'select',
			},
			options: [ 'None', 'Error notice' ],
			mapping: {
				None: null,
				'Error notice': (
					<Notice status="error" isDismissible={ true }>
						Error message
					</Notice>
				),
			},
		},
	},
	parameters: {
		controls: {
			exclude: /on[A-Z].*/,
		},
	},
};

const DefaultTemplate = args => {
	const [ value, setValue ] = useState( '' );

	const handleChange = ( newValue: string ) => {
		setValue( newValue );
		args?.onChange?.( newValue );
	};

	return <AIControl { ...args } onChange={ handleChange } value={ args?.value ?? value } />;
};

const DefaultArgs = {
	placeholder: 'Placeholder',
	disabled: false,
	isTransparent: false,
	state: 'init',
	onChange: action( 'onChange' ),
	message: null,
	banner: null,
	error: null,
	actions: null,
};

export const Default = DefaultTemplate.bind( {} );
Default.args = DefaultArgs;
