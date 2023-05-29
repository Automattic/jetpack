/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';

type SiteAIAssistantFeatureEndpointResponseProps = {
	'has-feature': boolean;
	'is-over-limit': boolean;
	'requests-count': number;
	'requests-limit': number;
};

const NUM_FREE_REQUESTS_LIMIT = 20;

export default function useAIFeature() {
	const [ data, setData ] = useState( {
		hasFeature: true,
		isOverLimit: false,
		requestsCount: 0,
		requestsLimit: NUM_FREE_REQUESTS_LIMIT,
		requireUpgrade: false,
	} );

	useEffect( () => {
		( async () => {
			const response: SiteAIAssistantFeatureEndpointResponseProps = await apiFetch( {
				path: '/wpcom/v2/jetpack-ai/ai-assistant-feature',
			} );

			try {
				const hasFeature = !! response[ 'has-feature' ];
				const isOverLimit = !! response[ 'is-over-limit' ];
				const requireUpgrade = ! hasFeature && isOverLimit;

				setData( {
					hasFeature,
					isOverLimit,
					requestsCount: response[ 'requests-count' ],
					requestsLimit: response[ 'requests-limit' ],
					requireUpgrade,
				} );
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} )();
	}, [] );

	return data;
}
