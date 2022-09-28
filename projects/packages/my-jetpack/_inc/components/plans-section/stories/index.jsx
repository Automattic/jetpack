/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import withMock from 'storybook-addon-mock';
import PlansSection from '../index.jsx';
import { purchasesList, siteWithSecurityPlanResponseBody } from './mock-data';

export default {
	title: 'Packages/My Jetpack/Plans Section',
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
		{
			url: 'my-jetpack/v1/site/purchases?_locale=user',
			method: 'GET',
			status: 200,
			response: purchasesList,
		},
	],
};

_default.args = DefaultArgs;

export const NoSitePlan = Template.bind( {} );
NoSitePlan.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/purchases?_locale=user',
			method: 'GET',
			status: 200,
			response: [],
		},
	],
};

export const OnePlan = Template.bind( {} );
OnePlan.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/purchases?_locale=user',
			method: 'GET',
			status: 200,
			response: [ purchasesList[ 0 ] ],
		},
	],
};

export const MultiplePlans = Template.bind( {} );
MultiplePlans.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/purchases?_locale=user',
			method: 'GET',
			status: 200,
			response: purchasesList,
		},
	],
};
