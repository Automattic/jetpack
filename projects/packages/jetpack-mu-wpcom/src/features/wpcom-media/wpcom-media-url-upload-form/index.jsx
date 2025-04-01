import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useState, useMemo } from 'react';
import { wpcomTrackEvent } from '../../../common/tracks';

import './style.scss';

const WpcomMediaUrlUploadForm = ( { ajaxUrl, action, nonce, page } ) => {
	const [ url, setUrl ] = useState( '' );

	const [ show, setShow ] = useState( false );
	const [ isUploading, setIsUploading ] = useState( false );

	const hasMediaItemsForm = useMemo( () => {
		return (
			page === 'media-new' &&
			!! document.getElementById( 'media-items' ) &&
			!! window.fileQueued &&
			!! window.uploadSuccess &&
			!! window.uploadError
		);
	}, [ page ] );

	const handleUrlChange = e => {
		setUrl( e.target.value );
	};

	const handleBeforeUpload = fileObj => {
		setIsUploading( true );

		if ( hasMediaItemsForm ) {
			window.fileQueued( fileObj );
		}
	};

	const handleUpload = async () => {
		const formData = new FormData();
		formData.append( 'action', action );
		formData.append( 'url', url );
		formData.append( '_ajax_nonce', nonce );

		const response = await fetch( ajaxUrl, {
			method: 'POST',
			body: formData,
		} );

		return await response.json();
	};

	const handlePostUpload = ( fileObj, { success, data } ) => {
		if ( hasMediaItemsForm ) {
			if ( success ) {
				window.uploadSuccess( fileObj, data.attachment_id );
				setIsUploading( false );
				setUrl( '' );
			} else {
				window.uploadError( fileObj );
				setIsUploading( false );
			}
			return;
		}

		if ( success ) {
			window.wp.media.model.Attachment.get( data.attachment_id ).fetch( {
				success: function ( attachment ) {
					const addAttachment = attachmentToAdd => {
						( window.wp.media.frame.controller || window.wp.media.frame ).content
							.get()
							.collection.add( attachmentToAdd );
					};

					if ( page === 'editor' ) {
						const mediaLibraryTab = window.wp.media.frame.state( 'library' );
						mediaLibraryTab.trigger( 'open' );

						addAttachment( attachment );

						const selection = mediaLibraryTab.get( 'selection' );
						selection.reset();
						selection.add( [ attachment ] );
					} else {
						addAttachment( attachment );
					}

					setIsUploading( false );
					setUrl( '' );
				},
			} );
		} else {
			setIsUploading( false );
			window.wp.Uploader.errors.add( { file: { name: url }, message: data[ 0 ].message } );
		}
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

		wpcomTrackEvent( 'wpcom_media_upload_from_url_submit', {
			page,
		} );

		const fileObj = {
			id: Date.now(),
			name: new URL( url ).pathname.split( '/' ).pop(),
		};

		handleBeforeUpload( fileObj );

		const response = await handleUpload();

		handlePostUpload( fileObj, response );

		return false;
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

	return (
		<div className="wpcom-media-url-upload-form">
			<a
				className="wpcom-media-url-upload-form__link button-link"
				href="#"
				onClick={ event => {
					event.preventDefault();
					setShow( value => ! value );
				} }
			>
				{ __( 'Upload from URL', 'jetpack-mu-wpcom' ) }
			</a>
			{ show && renderForm() }
		</div>
	);
};

export default WpcomMediaUrlUploadForm;
