import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
function getCookie( name ) {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) {
		return parts.pop().split( ';' ).shift();
	}
}

const getMapProvider = () => {
	// TODO: remove this
	const mapProviderCookie = getCookie( 'map_provider' );
	if ( mapProviderCookie ) {
		return mapProviderCookie;
	}

	if ( isAtomicSite() || isSimpleSite() || window.location.search.includes( 'mapkit' ) ) {
		return 'mapkit';
	}
	return 'mapbox';
};

export default getMapProvider;
