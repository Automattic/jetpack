/**
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { useState } from '@wordpress/element';

/**
 * Hook to get the type of site.
 *
 * @return {string} - The type of site.
 */
export default function useSiteType() {
	const getSiteType = () => {
		if ( isAtomicSite() ) {
			return 'atomic';
		}
		if ( isSimpleSite() ) {
			return 'simple';
		}
		return 'jetpack';
	};

	const [ siteType ] = useState( getSiteType() );

	return siteType;
}
