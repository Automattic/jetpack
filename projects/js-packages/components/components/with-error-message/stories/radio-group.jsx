/**
 * External dependencies
 */
import React from 'react';
import {
	__experimentalRadioGroup as RadioGroupStory,
	__experimentalRadio as Radio,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import withErrorMessage from '../index';

RadioGroupStory.displayName = 'RadioGroup';

const RadioGroupWithErrorMessage = withErrorMessage( RadioGroupStory );

export default {
	title: 'Playground/Error Message HOC',
};

const Template = args => (
	<RadioGroupWithErrorMessage { ...args }>
		<Radio value="25">25%</Radio>
		<Radio value="50">50%</Radio>
		<Radio value="75">75%</Radio>
		<Radio value="100">100%</Radio>
	</RadioGroupWithErrorMessage>
);

export const RadioGroup = Template.bind( {} );
RadioGroup.args = {
	errorMessage: 'Something went wrong…',
	displayError: true,
	label: 'Choose an option',
};
