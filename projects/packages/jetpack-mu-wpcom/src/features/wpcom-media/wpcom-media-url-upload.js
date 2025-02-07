import React from 'react';
import ReactDOM from 'react-dom/client';
import WpcomMediaUrlUploadForm from './wpcom-media-url-upload-form';

const props = typeof window === 'object' ? window.JETPACK_MU_WPCOM_MEDIA_URL_UPLOAD : {};

document.addEventListener( 'DOMContentLoaded', function () {
	if ( window.wp?.media?.view?.UploaderInline ) {
		const originalUploaderInline = window.wp.media.view.UploaderInline;

		window.wp.media.view.UploaderInline = originalUploaderInline.extend( {
			ready: function () {
				originalUploaderInline.prototype.ready.apply( this, arguments );

				const container = document.getElementById( 'wpcom-media-url-upload' );
				if ( container ) {
					const root = ReactDOM.createRoot( container );
					root.render( <WpcomMediaUrlUploadForm { ...props } /> );
				}
			},
		} );
	}
} );
