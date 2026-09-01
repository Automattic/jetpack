/**
 * External dependencies
 */
import { isWoASite, isSimpleSite } from '@automattic/jetpack-script-data';
import { useState } from '@wordpress/element';

/**
 * Hook to get the type of site.
 *
 * @return {string} - The type of site.
 */
export default function useSiteType() {
	const getSiteType = () => {
		if ( isWoASite() ) {
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
