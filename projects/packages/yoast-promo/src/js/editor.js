import './editor.scss';
import { getPlugin, registerPlugin } from '@wordpress/plugins';
import { YoastPromo } from '.';

// Check if a plugin with the same name has already been registered.
if ( ! getPlugin( 'jetpack-yoast-promo' ) ) {
	// If not, register our plugin.
	registerPlugin( 'jetpack-yoast-promo', {
		render: YoastPromo,
	} );
}
