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
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		setLoading( false );

		fetchRelatedPostsStatus()
			.then( status => {
				setIsEnabled( status );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	const enable = useCallback( () => {
		setLoading( true );

		enableRelatedPosts()
			.then( status => {
				setIsEnabled( status );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	return useMemo(
		() => ( {
			isEnabled,
			enable,
			loading,
		} ),
		[ isEnabled, enable, loading ]
	);
};

export { useRelatedPostsStatus };
