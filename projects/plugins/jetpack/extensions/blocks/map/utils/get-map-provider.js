function getCookie( name ) {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) {
		return parts.pop().split( ';' ).shift();
	}
}

const getMapProvider = props => {
	const mapboxStyles = [ 'terrain' ];
	if ( props?.mapStyle && mapboxStyles.includes( props.mapStyle ) ) {
		return 'mapbox';
	}

	const mapProviderCookie = getCookie( 'map_provider' );
	if ( mapProviderCookie ) {
		return mapProviderCookie;
	}

	if ( window && typeof window.Jetpack_Maps?.provider === 'string' ) {
		if ( [ 'mapbox', 'mapkit' ].includes( window.Jetpack_Maps?.provider ) ) {
			return window.Jetpack_Maps?.provider;
		}
	}
	return 'mapbox';
};

export default getMapProvider;
