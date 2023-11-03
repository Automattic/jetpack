/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
/**
 * Types & constants
 */
export type UpgradeTypeProp = 'vip' | 'default';
import type { SiteAIAssistantFeatureEndpointResponseProps } from '../../../../types';

export type AIFeatureProps = {
	hasFeature: boolean;
	isOverLimit: boolean;
	requestsCount: number;
	requestsLimit: number;
	requireUpgrade: boolean;
	errorMessage: string;
	errorCode: string;
	upgradeType: UpgradeTypeProp;
	currentTier: {
		value: 0 | 1 | 100 | 200 | 500;
	};
	usagePeriod: {
		currentStart: string;
		nextStart: string;
		requestsCount: number;
	};
};

const NUM_FREE_REQUESTS_LIMIT = 20;

const aiAssistantFeature = window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ];

export const AI_Assistant_Initial_State = {
	hasFeature: !! aiAssistantFeature?.[ 'has-feature' ],
	isOverLimit: !! aiAssistantFeature?.[ 'is-over-limit' ],
	requestsCount: aiAssistantFeature?.[ 'requests-count' ] || 0,
	requestsLimit: aiAssistantFeature?.[ 'requests-limit' ] || NUM_FREE_REQUESTS_LIMIT,
	requireUpgrade: !! aiAssistantFeature?.[ 'site-require-upgrade' ],
	errorMessage: aiAssistantFeature?.[ 'error-message' ] || '',
	errorCode: aiAssistantFeature?.[ 'error-code' ],
	upgradeType: aiAssistantFeature?.[ 'upgrade-type' ] || 'default',
	usagePeriod: {
		currentStart: aiAssistantFeature?.[ 'usage-period' ]?.[ 'current-start' ],
		nextStart: aiAssistantFeature?.[ 'usage-period' ]?.[ 'next-start' ],
		requestsCount: aiAssistantFeature?.[ 'usage-period' ]?.[ 'requests-count' ] || 0,
	},
	currentTier: {
		value: aiAssistantFeature?.[ 'current-tier' ]?.value || 1,
	},
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
			errorMessage: response[ 'error-message' ],
			errorCode: response[ 'error-code' ],
			upgradeType: response[ 'upgrade-type' ],
			usagePeriod: {
				currentStart: response[ 'usage-period' ]?.[ 'current-start' ],
				nextStart: response[ 'usage-period' ]?.[ 'next-start' ],
				requestsCount: response[ 'usage-period' ]?.[ 'requests-count' ] || 0,
			},
			currentTier: {
				value: response[ 'current-tier' ]?.value || 1,
			},
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

	return {
		...data,
		refresh: () => getAIFeatures().then( setData ),
	};
}
