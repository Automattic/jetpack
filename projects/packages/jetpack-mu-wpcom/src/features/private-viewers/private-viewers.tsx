import { __ } from '@wordpress/i18n';
import { createRoot } from 'react-dom/client';

/**
 * Private Viewers Component
 *
 * @return {JSX.Element} The component to render.
 */
function PrivateViewers() {
	return (
		<div className="wrap">
			<h1>{ __( 'Private Viewers', 'jetpack-mu-wpcom' ) }</h1>
		</div>
	);
}

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'wpcom-private-viewers-root' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <PrivateViewers /> );
	}
} );
