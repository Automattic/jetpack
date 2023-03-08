import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';

function getCookie( name ) {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) {
		return parts.pop().split( ';' ).shift();
	}
}

const getMapProvider = props => {
	const mapboxStyles = [ 'black_and_white', 'terrain' ];
	if ( props?.mapStyle && mapboxStyles.includes( props.mapStyle ) ) {
		return 'mapbox';
	}

	const mapProviderCookie = getCookie( 'map_provider' );
	if ( mapProviderCookie ) {
		return mapProviderCookie;
	}

	if ( isAtomicSite() || isSimpleSite() ) {
		return 'mapkit';
	}
	return 'mapbox';
};

export default getMapProvider;
