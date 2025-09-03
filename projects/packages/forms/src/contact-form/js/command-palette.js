import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCommand } from '@wordpress/commands';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { icon } from '../../blocks/contact-form/';

domReady( () => {
	// Command palette available across WP Admin from WP 6.9
	if ( typeof useCommand === 'function' ) {
		const { tracks } = useAnalytics();

		useCommand( {
			icon,
			label: __( 'View form responses', 'jetpack-forms' ),
			name: 'jetpack/forms-inbox',
			callback: ( { close } ) => {
				tracks.recordEvent( 'jetpack_command_palette_forms_inbox_open' );
				document.location.href = 'admin.php?page=jetpack-forms-admin#/responses?status=inbox';
				close();
			},
		} );
		useCommand( {
			icon,
			label: __( 'View form spam', 'jetpack-forms' ),
			name: 'jetpack/forms-spam',
			callback: ( { close } ) => {
				tracks.recordEvent( 'jetpack_command_palette_forms_spam_open' );
				document.location.href = 'admin.php?page=jetpack-forms-admin#/responses?status=spam';
				close();
			},
		} );
	}
} );
