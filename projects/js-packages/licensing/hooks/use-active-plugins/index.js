import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from '@wordpress/element';

const fetchActivePlugins = async () => {
	const plugins = await apiFetch( { path: 'wp/v2/plugins' } );
	return plugins.filter( plugin => plugin.status === 'active' );
};

/**
 * Hook to handle retrieving dismissed notices and dismissing a notice.
 *
 * @returns {Array} An array of active plugins.
 */
export default function useActivePlugins() {
	const [ activePlugins, setActivePlugins ] = useState( [] );
	const [ isFetching, setIsFetching ] = useState( true );

	const fetchAsync = useCallback( async () => {
		try {
			const fetchedActivePlugins = await fetchActivePlugins();
			setActivePlugins( fetchedActivePlugins );
		} catch {
			setActivePlugins( [] );
		} finally {
			setIsFetching( false );
		}
	}, [] );

	useEffect( () => {
		fetchAsync();
	}, [ fetchAsync ] );

	return [ activePlugins, isFetching ];
}
