import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useState } from 'react';

import './style.scss';

const WpcomMediaUrlUploadForm = ( { ajaxUrl, action, nonce, isSiteEditor } ) => {
	const [ url, setUrl ] = useState( '' );

	const [ show, setShow ] = useState( false );
	const [ isUploading, setIsUploading ] = useState( false );

	const handleUrlChange = e => {
		setUrl( e.target.value );
	};

	const handleSubmit = async e => {
		if ( isUploading ) {
			return false;
		}
		try {
			new URL( url ); // eslint-disable-line no-new
		} catch {
			return false;
		}
		e.preventDefault();

		const formData = new FormData();
		formData.append( 'action', action );
		formData.append( 'url', url );
		formData.append( '_ajax_nonce', nonce );

		setIsUploading( true );

		const response = await fetch( ajaxUrl, {
			method: 'POST',
			body: formData,
		} );

		const { success, data } = await response.json();

		if ( success ) {
			window.wp.media.model.Attachment.get( data.attachment_id ).fetch( {
				success: function ( attachment ) {
					if ( isSiteEditor ) {
						const mediaLibraryTab = window.wp.media.frame.state( 'library' );
						mediaLibraryTab.trigger( 'open' );

						window.wp.media.frame.controller.browserView.collection.add( attachment );

						const selection = mediaLibraryTab.get( 'selection' );
						selection.reset();
						selection.add( [ attachment ] );
					} else {
						window.wp.media.frame.controller.browserView.collection.add( attachment );
					}

					setIsUploading( false );
					setUrl( '' );
				},
			} );
		} else {
			setIsUploading( false );
			window.wp.Uploader.errors.add( { file: { name: url }, message: data[ 0 ].message } );
		}

		return false;
	};

	const renderLink = () => {
		return (
			<a href="#" onClick={ () => setShow( true ) }>
				{ __( 'Upload from URL', 'jetpack-mu-wpcom' ) }
			</a>
		);
	};

	const renderForm = () => {
		let buttonText = __( 'Upload', 'jetpack-mu-wpcom' );
		if ( isUploading ) {
			buttonText = __( 'Uploading…', 'jetpack-mu-wpcom' );
		}
		return (
			<form onSubmit={ handleSubmit }>
				<input
					type="url"
					value={ url }
					onChange={ handleUrlChange }
					placeholder={ __( 'Enter media URL', 'jetpack-mu-wpcom' ) }
					required
					readOnly={ isUploading }
				/>
				<button
					type="submit"
					className={ clsx( 'button', 'button-primary', {
						'updating-message': isUploading,
					} ) }
					readOnly={ isUploading }
				>
					{ buttonText }
				</button>
			</form>
		);
	};

	return <div className="wpcom-media-url-upload-form">{ show ? renderForm() : renderLink() }</div>;
};

export default WpcomMediaUrlUploadForm;
