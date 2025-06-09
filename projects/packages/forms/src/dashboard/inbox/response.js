/**
 * External dependencies
 */
import {
	Button,
	ExternalLink,
	Modal,
	Tooltip,
	Spinner,
	Icon,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import clsx from 'clsx';
import { map } from 'lodash';
/**
 * Internal dependencies
 */
import { useMarkAsSpam } from '../hooks/use-mark-as-spam';
import { getPath } from './utils';

const getDisplayName = response => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
};

const isFileUploadField = value => {
	return value && typeof value === 'object' && 'files' in value && 'field_id' in value;
};

const PreviewFile = ( { file, isLoading, onImageLoaded } ) => {
	const imageClass = clsx( 'jp-forms__inbox-file-preview-container', {
		'is-loading': isLoading,
	} );

	return (
		<div className="jp-forms__inbox-file-preview-shell">
			{ isLoading && (
				<div className="jp-forms__inbox-file-loading">
					<Spinner className="jp-forms__inbox-spinner" />
					<div className="jp-forms__inbox-file-loading-message ">
						{ __( 'Loading preview…', 'jetpack-forms' ) }
					</div>
				</div>
			) }

			<div className={ imageClass }>
				<img
					src={ file.url }
					alt={ decodeEntities( file.name ) }
					onLoad={ onImageLoaded }
					className="jp-forms__inbox-file-preview-image"
				/>
			</div>
		</div>
	);
};

const FileField = ( { file, onClick, key } ) => {
	const fileExtension = file.name.split( '.' ).pop().toLowerCase();
	const fileType = file.type.split( '/' )[ 0 ];

	const iconMap = {
		image: 'png',
		video: 'mp4',
		audio: 'mp3',
		document: 'pdf',
		application: 'txt',
	};

	const extensionMap = {
		pdf: 'pdf',
		png: 'png',
		jpg: 'png',
		jpeg: 'png',
		gif: 'png',
		mp4: 'mp4',
		mp3: 'mp3',
		webm: 'webm',
		doc: 'doc',
		docx: 'doc',
		txt: 'txt',
		ppt: 'ppt',
		pptx: 'ppt',
		xls: 'xls',
		xlsx: 'xls',
		csv: 'xls',
		zip: 'zip',
		sql: 'sql',
		cal: 'cal',
	};
	const iconType = extensionMap[ fileExtension ] || iconMap[ fileType ] || 'txt';
	const iconClass = clsx( 'file-field__icon', 'icon-' + iconType );
	return (
		<div key={ key } className="file-field__item">
			<div className="file-field__info">
				<div className={ iconClass }></div>
				<div className="file-field__name">
					{ file.is_previewable && (
						<Button target="_blank" variant="link" onClick={ onClick }>
							{ decodeEntities( file.name ) }
						</Button>
					) }
					{ ! file.is_previewable && (
						<ExternalLink href={ file.url + '&preview=true' }>
							{ decodeEntities( file.name ) }
						</ExternalLink>
					) }
					<div className="file-field__meta-info">
						{ sprintf(
							/* translators: %1$s size of the file and %2$s is the file extension */
							__( '%1$s, %2$s', 'jetpack-forms' ),
							file.size,
							fileExtension.toUpperCase()
						) }
					</div>
				</div>
			</div>
			<span className="file-field__item-actions">
				<Tooltip text={ __( 'Download', 'jetpack-forms' ) }>
					<Button variant="secondary" href={ file.url } target="_blank">
						<Icon icon={ download } />
					</Button>
				</Tooltip>
			</span>
		</div>
	);
};

const InboxResponse = ( { response, loading, onModalStateChange } ) => {
	const [ emailCopied, setEmailCopied ] = useState( false );
	const [ isPreviewModalOpen, setIsPreviewModalOpen ] = useState( false );
	const [ previewFile, setPreviewFile ] = useState( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );

	// When opening a "Mark as spam" link from the email, the InboxResponse component is rendered, so we use a hook here to handle it.
	const { isConfirmDialogOpen, onConfirmMarkAsSpam, onCancelMarkAsSpam } =
		useMarkAsSpam( response );

	const ref = useRef( undefined );

	const openFilePreview = useCallback(
		file => {
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
		file => openFilePreview.bind( null, file ),
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
					{ value.files?.length
						? value.files.map( ( file, index ) => {
								if ( ! file || ! file.name ) {
									return null;
								}
								return (
									<FileField file={ file } onClick={ handleFilePreview( file ) } key={ index } />
								);
						  } )
						: '-' }
				</div>
			);
		}

		// Emails
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( emailRegex.test( value ) ) {
			return <a href={ `mailto:${ value }` }>{ value }</a>;
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
			<PreviewFile
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
					<PreviewFile
						file={ previewFile }
						isLoading={ isImageLoading }
						onImageLoaded={ handelImageLoaded }
					/>
				</Modal>
			) }

			<ConfirmDialog
				isOpen={ isConfirmDialogOpen }
				onConfirm={ onConfirmMarkAsSpam }
				onCancel={ onCancelMarkAsSpam }
			>
				{ __( 'Are you sure you want to mark this response as spam?', 'jetpack-forms' ) }
			</ConfirmDialog>
		</div>
	);
};

export default InboxResponse;
