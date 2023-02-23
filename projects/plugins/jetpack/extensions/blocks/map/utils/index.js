import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';

const getMapProvider = () => {
	if ( isAtomicSite() || isSimpleSite() || window.location.search.includes( 'mapkit' ) ) {
		return 'mapkit';
	}
	return 'mapbox';
};

export { getMapProvider };
