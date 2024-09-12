/**
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { useState } from '@wordpress/element';

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
