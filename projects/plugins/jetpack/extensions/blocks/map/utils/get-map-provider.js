import { isAtomicSite, isSimpleSite } from '../../../../../../js-packages/shared-extension-utils';

const getMapProvider = () => {
	if ( isAtomicSite() || isSimpleSite() || window.location.search.includes( 'mapkit' ) ) {
		return 'mapkit';
	}
	return 'mapbox';
};

export default getMapProvider;
