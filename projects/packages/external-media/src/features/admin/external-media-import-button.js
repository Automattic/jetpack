import jetpackAnalytics from '@automattic/jetpack-analytics';
import { __ } from '@wordpress/i18n';

document.addEventListener( 'DOMContentLoaded', function () {
	const addNewButton = document.querySelector( 'a.page-title-action' );
	if ( addNewButton ) {
		const buttonContainer = document.createElement( 'div' );
		buttonContainer.className = 'wpcom-media-library-action-buttons';

		const importButton = document.createElement( 'a' );
		importButton.className = 'button-secondary';
		importButton.role = 'button';
		importButton.innerHTML = __( 'Import Media', 'jetpack-external-media' );
		importButton.href = window.JETPACK_EXTERNAL_MEDIA_IMPORT_BUTTON?.href;
		importButton.onclick = function () {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_external_media_import_media_button_click', {
				page: 'media-library',
			} );
		};

		const parentNode = addNewButton.parentNode;
		const nextSibling = addNewButton.nextSibling;

		buttonContainer.appendChild( addNewButton );
		buttonContainer.appendChild( importButton );

		parentNode.insertBefore( buttonContainer, nextSibling );
	}
} );
