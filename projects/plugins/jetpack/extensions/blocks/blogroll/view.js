import useSubscribeApi from './use-subscribe-api';

import './style.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const blogrollItems = document.querySelectorAll(
		'a.wp-block-jetpack-blogroll-item__subscribe-button[id*="site-id-"]'
	);
	const { subscribeToBlog } = useSubscribeApi();

	if ( ! blogrollItems ) {
		return;
	}

	for ( const blogrollItem of blogrollItems ) {
		// Gets the site ID from the class name.
		const siteId = blogrollItem.id.match( /site-id-(\d+)/ )[ 1 ];
		blogrollItem.addEventListener( 'click', () => {
			subscribeToBlog( siteId );
		} );
	}
} );
