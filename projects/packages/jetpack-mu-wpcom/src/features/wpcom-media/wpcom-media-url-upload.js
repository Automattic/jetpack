import React from 'react';
import ReactDOM from 'react-dom/client';
import WpcomMediaUrlUploadForm from './wpcom-media-url-upload-form';

const props = typeof window === 'object' ? window.JETPACK_MU_WPCOM_MEDIA_URL_UPLOAD : {};

const selectors = {
	PLUPLOAD_UPLOAD_UI: 'plupload-upload-ui',
	PLUPLOAD_BROWSE_BUTTON: 'plupload-browse-button',
	WPCOM_MEDIA_URL_UPLOAD_CONTAINER: 'wpcom-media-url-upload',
};

const insertWpcomMediaUrlUploadForm = () => {
	const container = document.getElementById( selectors.WPCOM_MEDIA_URL_UPLOAD_CONTAINER );
	if ( container ) {
		const root = ReactDOM.createRoot( container );
		root.render( <WpcomMediaUrlUploadForm { ...props } /> );
	}
};

const removeWpcomMediaUrlUploadForm = () => {
	const container = document.getElementById( selectors.WPCOM_MEDIA_URL_UPLOAD_CONTAINER );
	if ( container ) {
		container.innerHTML = '';
	}
};

document.addEventListener( 'DOMContentLoaded', function () {
	const pluploadUploadUI = document.getElementById( selectors.PLUPLOAD_UPLOAD_UI );
	const selectFilesButton = document.getElementById( selectors.PLUPLOAD_BROWSE_BUTTON );
	if ( pluploadUploadUI && selectFilesButton ) {
		// Add the class to the outer container.
		if ( ! pluploadUploadUI.classList.contains( 'has-wpcom-media-url-upload' ) ) {
			pluploadUploadUI.classList.add( 'has-wpcom-media-url-upload' );
		}

		// Insert the container for the wpcom media url upload form.
		const container = document.createElement( 'div' );
		container.id = selectors.WPCOM_MEDIA_URL_UPLOAD_CONTAINER;
		selectFilesButton.parentNode.insertBefore( container, selectFilesButton.nextSibling );
		insertWpcomMediaUrlUploadForm();
		return;
	}

	if ( window.wp?.media?.view?.UploaderInline ) {
		const originalUploaderInline = window.wp.media.view.UploaderInline;

		window.wp.media.view.UploaderInline = originalUploaderInline.extend( {
			ready: function () {
				originalUploaderInline.prototype.ready.apply( this, arguments );
				// Insert the form directly if it cannot be closed.
				if ( ! this.options.canClose ) {
					insertWpcomMediaUrlUploadForm();
				}
			},
			show: function () {
				originalUploaderInline.prototype.show.apply( this, arguments );
				insertWpcomMediaUrlUploadForm();
			},
			hide: function () {
				originalUploaderInline.prototype.hide.apply( this, arguments );
				removeWpcomMediaUrlUploadForm();
			},
		} );
	}
} );
