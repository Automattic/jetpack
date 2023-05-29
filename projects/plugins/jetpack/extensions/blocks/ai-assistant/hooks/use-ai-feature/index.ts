/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';

export type SiteAIAssistantFeatureEndpointResponseProps = {
	'has-feature': boolean;
	'is-over-limit': boolean;
	'requests-count': number;
	'requests-limit': number;
	'site-require-upgrade': boolean;
};

type AIFeatureProps = {
	hasFeature: boolean;
	isOverLimit: boolean;
	requestsCount: number;
	requestsLimit: number;
	requireUpgrade: boolean;
};

const NUM_FREE_REQUESTS_LIMIT = 20;

export const AI_Assistant_Initial_State = {
	hasFeature: window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'has-feature' ] || true,
	isOverLimit:
		window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'is-over-limit' ] || false,
	requestsCount:
		window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'requests-count' ] || 0,
	requestsLimit:
		window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'requests-limit' ] ||
		NUM_FREE_REQUESTS_LIMIT,
	requireUpgrade:
		window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'site-require-upgrade' ] || false,
};

export async function getAIFeatures(): Promise< AIFeatureProps > {
	const response: SiteAIAssistantFeatureEndpointResponseProps = await apiFetch( {
		path: '/wpcom/v2/jetpack-ai/ai-assistant-feature',
	} );

	try {
		return {
			hasFeature: !! response[ 'has-feature' ],
			isOverLimit: !! response[ 'is-over-limit' ],
			requestsCount: response[ 'requests-count' ],
			requestsLimit: response[ 'requests-limit' ],
			requireUpgrade: !! response[ 'site-require-upgrade' ],
		};
	} catch ( error ) {
		console.error( error ); // eslint-disable-line no-console
	}
}

export default function useAIFeature() {
	const [ data, setData ] = useState< AIFeatureProps >( AI_Assistant_Initial_State );

	useEffect( () => {
		getAIFeatures().then( setData );
	}, [] );

	return data;
}
