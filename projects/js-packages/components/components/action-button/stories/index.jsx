/**
 * External dependencies
 */
import React from 'react';
import { action } from '@storybook/addon-actions';

/**
 * Internal dependencies
 */
import { ActionButtonComponent } from '../index';

export default {
	title: 'Playground/Action Button',
	component: ActionButtonComponent,
	// TODO: Storybook Actions are not working. See https://github.com/storybookjs/storybook/issues/7215
	argTypes: {
		onButtonClick: { action: 'clicked' },
	},
};

// Export additional stories using pre-defined values
const Template = args => <ActionButtonComponent { ...args } />;

const DefaultArgs = {
	onButtonClick: action( 'onButtonClick' ),
	displayError: false,
	isLoading: false,
	label: 'Action!',
};

// Export Default story using knobs
export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const Loading = Template.bind( {} );
Loading.args = {
	...DefaultArgs,
	isLoading: true,
};

export const Errored = Template.bind( {} );
Errored.args = {
	...DefaultArgs,
	displayError: true,
};
