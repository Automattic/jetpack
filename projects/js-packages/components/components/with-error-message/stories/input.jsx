/**
 * External dependencies
 */
import React from 'react';
import { __experimentalInputControl as InputControlStory } from '@wordpress/components';

/**
 * Internal dependencies
 */
import withErrorMessage from '../index';

const InputWithErrorMessage = withErrorMessage( InputControlStory );

export default {
	title: 'Playground/Error Message HOC',
	component: InputWithErrorMessage,
};

const Template = args => <InputWithErrorMessage { ...args } />;

export const InputControl = Template.bind( {} );
InputControl.args = {
	errorMessage: 'Something went wrong…',
	displayError: true,
	label: 'The sample input',
};
