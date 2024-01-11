/*
 * External Dependencies
 */
import React from 'react';
/*
 * Internal Dependencies
 */
import UsagePanel from '..';

export default {
	title: 'Plugins/Jetpack/Extensions/UsagePanel',
	component: UsagePanel,
	parameters: {
		docs: {
			autodocs: false,
		},
	},
};

const DefaultTemplate = () => {
	const props = {};

	return <UsagePanel { ...props } />;
};

export const aiAssistantFeatureUnsupported = DefaultTemplate.bind( {} );
aiAssistantFeatureUnsupported.parameters = {
	mockData: [
		{
			url: 'wpcom/v2/jetpack-ai/ai-assistant-feature?_locale=user',
			method: 'GET',
			status: 200,
			response: {
				'has-feature': false,
				'requests-count': 11,
				'requests-limit': 20,
			},
		},
	],
};
aiAssistantFeatureUnsupported.storyName = 'AI Assistant feature unsupported';

export const aiAssisstantFeatureSupported = DefaultTemplate.bind( {} );
aiAssisstantFeatureSupported.parameters = {
	mockData: [
		{
			url: 'wpcom/v2/jetpack-ai/ai-assistant-feature?_locale=user',
			method: 'GET',
			status: 200,
			response: {
				'has-feature': true,
				'requests-count': 120,
				'requests-limit': 20,
			},
		},
	],
};

aiAssisstantFeatureSupported.storyName = 'AI Assistant feature supported';
