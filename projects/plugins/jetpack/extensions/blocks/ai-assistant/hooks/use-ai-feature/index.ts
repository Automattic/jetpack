/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';

type SiteAIAssistantFeatureEndpointResponseProps = {
	'has-feature': boolean;
	'is-over-limit': boolean;
	count: number;
};

export default function useAIFeature() {
	const [ data, setData ] = useState( {
		hasFeature: true,
		isOverLimit: false,
		count: 0,
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
					count: response.count,
				} );
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} )();
	}, [] );

	return data;
}
