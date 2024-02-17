import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';

/**
 * Fetch Related Posts option status.
 *
 * @returns {Promise<boolean>} Whether Related Posts is enabled.
 */
async function fetchRelatedPostsStatus() {
	try {
		const result = await apiFetch( {
			path: `/wpcom/v2/related-posts`,
		} );
		return result?.enabled ?? false;
	} catch ( error ) {
		return false;
	}
}

/**
 * Enable Related Posts option.
 *
 * @returns {Promise<boolean>} Whether Related Posts is enabled.
 */
async function enableRelatedPosts() {
	try {
		const result = await apiFetch( {
			path: `/wpcom/v2/related-posts/enable`,
			method: 'POST',
		} );
		return result;
	} catch ( error ) {
		return false;
	}
}

const useRelatedPostsStatus = () => {
	const [ isFetchingStatus, setisFetchingStatus ] = useState( false );
	const [ isUpdatingStatus, setIsUpdatingStatus ] = useState( false );
	const [ isEnabled, setIsEnabled ] = useState( false );

	useEffect( () => {
		setisFetchingStatus( true );

		fetchRelatedPostsStatus()
			.then( status => {
				setIsEnabled( status );
				setisFetchingStatus( false );
			} )
			.catch( () => {
				setisFetchingStatus( false );
			} );
	}, [] );

	const enable = useCallback( () => {
		setIsUpdatingStatus( true );

		enableRelatedPosts()
			.then( status => {
				setIsEnabled( status );
				setIsUpdatingStatus( false );
			} )
			.catch( () => {
				setIsUpdatingStatus( false );
			} );
	}, [] );

	return useMemo(
		() => ( {
			isEnabled,
			enable,
			isFetchingStatus,
			isUpdatingStatus,
		} ),
		[ isEnabled, enable, isFetchingStatus, isUpdatingStatus ]
	);
};

export { useRelatedPostsStatus };
