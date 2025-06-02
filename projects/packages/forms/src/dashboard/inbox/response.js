/**
 * External dependencies
 */
import { Button, ExternalLink, Modal, Spinner } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { map } from 'lodash';
import { getPath } from './utils';

const getDisplayName = response => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
};

const isFileUploadField = value => {
	return value && typeof value === 'object' && 'files' in value && 'field_id' in value;
};

const PreviewImage = ( { file, isLoading, onImageLoaded } ) => {
	return (
		<div className="jp-forms__inbox-file-preview-container">
			{ isLoading && (
				<div className="jp-forms__inbox-file-loading">
					<div className="components-spinner" />
					<div className="jp-forms__inbox-file-loading-message">
						<Spinner />
						{ __( 'Loading file preview…', 'jetpack-forms' ) }
					</div>
				</div>
			) }
			<img
				src={ file.preview_url || file.url }
				alt={ decodeEntities( file.name ) }
				onLoad={ onImageLoaded }
				className="jp-forms__inbox-file-preview-image"
				style={ { display: isLoading ? 'none' : 'block' } }
			/>
		</div>
	);
};

const InboxResponse = ( { response, loading, onModalStateChange } ) => {
	const [ emailCopied, setEmailCopied ] = useState( false );
	const [ isPreviewModalOpen, setIsPreviewModalOpen ] = useState( false );
	const [ previewFile, setPreviewFile ] = useState( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );

	const ref = useRef( undefined );

	const openFilePreview = useCallback(
		( file, e ) => {
			e.preventDefault();
			setIsImageLoading( true );
			setPreviewFile( file );
			setIsPreviewModalOpen( true );
			if ( onModalStateChange ) {
				onModalStateChange( true );
			}
		},
		[ onModalStateChange, setPreviewFile, setIsPreviewModalOpen ]
	);

	const handleFilePreview = useCallback(
		file => {
			return openFilePreview.bind( null, file );
		},
		[ openFilePreview ]
	);

	const closePreviewModal = useCallback( () => {
		setIsPreviewModalOpen( false );
		setIsImageLoading( true );
		// Notify parent component that this modal is closed
		if ( onModalStateChange ) {
			onModalStateChange( false );
		}
	}, [ onModalStateChange, setIsPreviewModalOpen, setIsImageLoading ] );

	const renderFieldValue = value => {
		if ( isFileUploadField( value ) ) {
			return (
				<div className="file-field">
					{ value.files.map( ( file, index ) => {
						return (
							<div key={ index } className="file-field__item">
								<span className="file-field__item-name">{ decodeEntities( file.name ) }</span>
								<span className="file-field__item-actions">
									<span>{ file.size }</span>
									<Button variant="link" target="_blank" onClick={ handleFilePreview( file ) }>
										{ __( 'Preview', 'jetpack-forms' ) }
									</Button>

									<Button variant="link" href={ file.url } target="_blank">
										{ __( 'Download', 'jetpack-forms' ) }
									</Button>
								</span>
							</div>
						);
					} ) }
				</div>
			);
		}
		return value;
	};

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		ref.current.scrollTop = 0;
	}, [ response ] );

	const copyEmail = useCallback( async () => {
		await window.navigator.clipboard.writeText( response.author_email );
		setEmailCopied( true );
		setTimeout( () => setEmailCopied( false ), 3000 );
	}, [ response, setEmailCopied ] );

	const handelImageLoaded = useCallback( () => {
		return setIsImageLoading( false );
	}, [ setIsImageLoading ] );

	if ( ! loading && ! response ) {
		return null;
	}

	const titleClasses = clsx( 'jp-forms__inbox-response-title', {
		'is-email': response && ! response.author_name && response.author_email,
		'is-ip': response && ! response.author_name && ! response.author_email,
		'is-name': response && response.author_name,
	} );

	if ( isPreviewModalOpen && ! onModalStateChange ) {
		return (
			<PreviewImage
				file={ previewFile }
				isLoading={ isImageLoading }
				onImageLoaded={ handelImageLoaded }
			/>
		);
	}
	return (
		<div ref={ ref } className="jp-forms__inbox-response">
			<div className="jp-forms__inbox-response-avatar">
				<img
					src="https://gravatar.com/avatar/6e998f49bfee1a92cfe639eabb350bc5?size=68&default=identicon"
					alt={ __( "Respondent's gravatar", 'jetpack-forms' ) }
				/>
			</div>

			<h3 className={ titleClasses }>{ getDisplayName( response ) }</h3>
			{ response.author_email && getDisplayName( response ) !== response.author_email && (
				<p className="jp-forms__inbox-response-subtitle">
					{ response.author_email }
					<Button variant="secondary" onClick={ copyEmail }>
						{ ! emailCopied && __( 'Copy', 'jetpack-forms' ) }
						{ emailCopied && __( '✓ Copied', 'jetpack-forms' ) }
					</Button>
				</p>
			) }

			<div className="jp-forms__inbox-response-meta">
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key">
						{ __( 'Date:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">
						{ sprintf(
							/* Translators: %1$s is the date, %2$s is the time. */
							__( '%1$s at %2$s', 'jetpack-forms' ),
							dateI18n( getDateSettings().formats.date, response.date ),
							dateI18n( getDateSettings().formats.time, response.date )
						) }
					</span>
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key">
						{ __( 'Source:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">
						<ExternalLink href={ response.entry_permalink }>
							{ decodeEntities( response.entry_title ) || getPath( response ) }
						</ExternalLink>
					</span>
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key	">
						{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">{ response.ip }</span>
				</div>
			</div>

			<div className="jp-forms__inbox-response-separator" />

			<div className="jp-forms__inbox-response-data">
				{ map( response.fields, ( value, key ) => (
					<div key={ key } className="jp-forms__inbox-response-item">
						<div className="jp-forms__inbox-response-data-label">
							{ key.endsWith( '?' ) ? key : `${ key }:` }
						</div>
						<div className="jp-forms__inbox-response-data-value">{ renderFieldValue( value ) }</div>
					</div>
				) ) }
			</div>

			{ isPreviewModalOpen && previewFile && onModalStateChange && (
				<Modal
					title={ decodeEntities( previewFile.name ) }
					onRequestClose={ closePreviewModal }
					className="jp-forms__inbox-file-preview-modal"
				>
					<PreviewImage
						file={ previewFile }
						isLoading={ isImageLoading }
						onImageLoaded={ handelImageLoaded }
					/>
				</Modal>
			) }
		</div>
	);
};

export default InboxResponse;
