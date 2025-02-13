import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

/**
 * Hook to get the static minification state
 * @return {boolean} Whether static minification is enabled
 */
export const useStaticMinification = () => {
	const [ query ] = useDataSync( 'jetpack_boost_ds', 'static_minification', z.boolean() );

	return query;
};
