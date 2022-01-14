/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import { siteWithSecurityPlanResponseBody } from './mock-data';
import PlansSection from '../index.jsx';

export default {
	title: 'My Jetpack/Plans Section',
	component: PlansSection,
	decorators: [ withMock ],
	argTypes: {
		logoColor: { control: 'color' },
	},
};

const Template = args => <PlansSection { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );

_default.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site?_locale=user',
			method: 'GET',
			status: 200,
			response: siteWithSecurityPlanResponseBody,
		},
	],
};

_default.args = DefaultArgs;
