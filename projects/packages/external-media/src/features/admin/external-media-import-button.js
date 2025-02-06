import { __ } from '@wordpress/i18n';

document.addEventListener( 'DOMContentLoaded', function () {
	const addNewButton = document.querySelector( 'a.page-title-action' );
	if ( addNewButton ) {
		const buttonContainer = document.createElement( 'div' );
		buttonContainer.className = 'wpcom-media-library-action-buttons';

		const importButton = document.createElement( 'a' );
		importButton.className = 'page-title-action';
		importButton.role = 'button';
		importButton.innerHTML = __( 'Import Media', 'jetpack-external-media' );
		importButton.href = window.JETPACK_EXTERNAL_MEDIA_IMPORT_BUTTON?.href;
		importButton.onclick = event => event.stopImmediatePropagation();

		const parentNode = addNewButton.parentNode;
		const nextSibling = addNewButton.nextSibling;

		buttonContainer.appendChild( addNewButton );
		buttonContainer.appendChild( importButton );

		parentNode.insertBefore( buttonContainer, nextSibling );
	}
} );
