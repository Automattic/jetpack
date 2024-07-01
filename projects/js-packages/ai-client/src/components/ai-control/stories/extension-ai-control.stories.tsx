/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';
import React from 'react';
/**
 * Internal dependencies
 */
import { ExtensionAIControl } from '../index.js';

export default {
	title: 'JS Packages/AI Client/AI Control/Extension AI Control',
	component: ExtensionAIControl,
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
		error: {
			control: {
				type: 'text',
			},
		},
		requestsRemaining: {
			control: {
				type: 'number',
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
	const [ { value }, updateArgs, resetArgs ] = useArgs();

	const handleChange = ( newValue: string ) => {
		updateArgs( { value: newValue } );
		args?.onChange?.( newValue );
	};

	const handleSend = () => {
		updateArgs( { state: 'requesting', error: null, value: '', placeholder: value } );

		setTimeout( () => {
			updateArgs( { state: 'suggesting' } );

			setTimeout( () => {
				updateArgs( { state: 'done' } );
			}, 3000 );
		}, 1000 );

		args?.onSend?.( value );
	};

	const handleStop = () => {
		updateArgs( { state: 'done', error: null } );
		args?.onStop?.();
	};

	const handleClose = () => {
		resetArgs();
		args?.onClose?.();
		resetArgs();
	};

	const handleUndo = () => {
		resetArgs();
		args?.onUndo?.();
		resetArgs();
	};

	const handleUpgrade = () => {
		args?.onUpgrade?.();
	};

	return (
		<ExtensionAIControl
			{ ...args }
			onChange={ handleChange }
			onSend={ handleSend }
			onStop={ handleStop }
			onClose={ handleClose }
			onUndo={ handleUndo }
			onUpgrade={ handleUpgrade }
			value={ args?.value ?? value }
		/>
	);
};

const DefaultArgs = {
	value: '',
	placeholder: 'Placeholder',
	showButtonLabels: true,
	disabled: false,
	isTransparent: false,
	state: 'init',
	showGuideLine: false,
	error: null,
	requestsRemaining: null,
	showUpgradeMessage: false,
	onChange: action( 'onChange' ),
	onSend: action( 'onSend' ),
	onStop: action( 'onStop' ),
	onClose: action( 'onClose' ),
	onUndo: action( 'onUndo' ),
	onUpgrade: action( 'onUpgrade' ),
};

export const Default = DefaultTemplate.bind( {} );
Default.args = DefaultArgs;
