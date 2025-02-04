import { __ } from '@wordpress/i18n';

document.addEventListener( 'DOMContentLoaded', function () {
	const addNewButton = document.querySelector( 'a.page-title-action' );
	if ( addNewButton ) {
		const importButton = document.createElement( 'a' );
		importButton.className = 'button';
		importButton.role = 'button';
		importButton.innerHTML = __( 'Import Media', 'jetpack-external-media' );
		importButton.href = window.JETPACK_EXTERNAL_MEDIA_IMPORT_BUTTON?.href;
		importButton.style = `
			position: relative;
			top: -3px;
			margin-left: 3px;
			vertical-align: baseline;
		`;

		addNewButton.parentNode.insertBefore( importButton, addNewButton.nextSibling );
	}
} );
