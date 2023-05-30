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
	'site-require-upgrade': boolean;
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
				setData( {
					hasFeature: !! response[ 'has-feature' ],
					isOverLimit: !! response[ 'is-over-limit' ],
					requestsCount: response[ 'requests-count' ],
					requestsLimit: response[ 'requests-limit' ],
					requireUpgrade: !! response[ 'site-require-upgrade' ],
				} );
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} )();
	}, [] );

	return data;
}
