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

	if ( window && window.map_block_map_provider ) {
		if ( [ 'mapbox', 'mapkit' ].includes( window.map_block_map_provider ) ) {
			return window.map_block_map_provider;
		}
	}
	return 'mapbox';
};

export default getMapProvider;
