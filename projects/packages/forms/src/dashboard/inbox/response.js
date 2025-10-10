/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	ExternalLink,
	Modal,
	Tooltip,
	Spinner,
	Icon,
	Tip,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useRegistry, useDispatch } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { download, close, chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useFormsConfig from '../../hooks/use-forms-config';
import CopyClipboardButton from '../components/copy-clipboard-button';
import Gravatar from '../components/gravatar';
import { useMarkAsSpam } from '../hooks/use-mark-as-spam';
import {
	markAsSpamAction,
	markAsNotSpamAction,
	moveToTrashAction,
	restoreAction,
	deleteAction,
	markAsReadAction,
	markAsUnreadAction,
} from './dataviews/actions';
import { getPath, updateMenuCounter, updateMenuCounterOptimistically } from './utils';

const getDisplayName = response => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
};

const isFileUploadField = value => {
	return value && typeof value === 'object' && 'files' in value;
};

const isImageSelectField = value => {
	return value?.type === 'image-select';
};

const isLikelyPhoneNumber = value => {
	// Only operate on strings to avoid coercing numbers (e.g., 2024) into strings that could match
	if ( typeof value !== 'string' ) {
		return false;
	}

	const normalizedValue = value.trim();

	// Allow only digits, spaces, parentheses, hyphens, dots, plus
	if ( ! /^[\d+\-\s().]+$/.test( normalizedValue ) ) {
		return false;
	}

	// Exclude common date formats to avoid false positives
	// - ISO-like: 2025-11-01 or 2025/11/01
	if ( /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test( normalizedValue ) ) {
		return false;
	}
	// - Locale-like: 01/11/2025, 1/11/25, 11-01-2025
	if ( /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test( normalizedValue ) ) {
		return false;
	}

	// Strip non-digits and validate digit count within a typical global range
	const digits = normalizedValue.replace( /\D/g, '' );
	if ( digits.length < 7 || digits.length > 15 ) {
		return false;
	}

	return true;
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

const FileField = ( { file, onClick } ) => {
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
		<div className="file-field__item">
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

const InboxResponse = ( {
	response,
	loading,
	onModalStateChange,
	onClose,
	onNext,
	onPrevious,
	hasNext,
	hasPrevious,
	onActionComplete,
	isMobile,
} ) => {
	const [ isPreviewModalOpen, setIsPreviewModalOpen ] = useState( false );
	const [ previewFile, setPreviewFile ] = useState( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );
	const [ isMarkingAsSpam, setIsMarkingAsSpam ] = useState( false );
	const [ isMarkingAsNotSpam, setIsMarkingAsNotSpam ] = useState( false );
	const [ isMovingToTrash, setIsMovingToTrash ] = useState( false );
	const [ isRestoring, setIsRestoring ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ hasMarkedSelfAsRead, setHasMarkedSelfAsRead ] = useState( false );

	const { editEntityRecord } = useDispatch( 'core' );

	const formsConfig = useFormsConfig();
	const emptyTrashDays = formsConfig?.emptyTrashDays ?? 0;

	// When opening a "Mark as spam" link from the email, the InboxResponse component is rendered, so we use a hook here to handle it.
	const { isConfirmDialogOpen, onConfirmMarkAsSpam, onCancelMarkAsSpam } =
		useMarkAsSpam( response );

	const registry = useRegistry();

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

	const handleMarkAsSpam = useCallback( async () => {
		setIsMarkingAsSpam( true );
		await markAsSpamAction.callback( [ response ], { registry } );
		setIsMarkingAsSpam( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsNotSpam = useCallback( async () => {
		setIsMarkingAsNotSpam( true );
		await markAsNotSpamAction.callback( [ response ], { registry } );
		setIsMarkingAsNotSpam( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleMoveToTrash = useCallback( async () => {
		setIsMovingToTrash( true );
		await moveToTrashAction.callback( [ response ], { registry } );
		setIsMovingToTrash( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleRestore = useCallback( async () => {
		setIsRestoring( true );
		await restoreAction.callback( [ response ], { registry } );
		setIsRestoring( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleDelete = useCallback( async () => {
		setIsDeleting( true );
		await deleteAction.callback( [ response ], { registry } );
		setIsDeleting( false );
		onActionComplete?.( response.id.toString() );
	}, [ response, registry, onActionComplete ] );

	const handleMarkAsRead = useCallback( () => {
		markAsReadAction.callback( [ response ], { registry } );
	}, [ response, registry ] );

	const handleMarkAsUnread = useCallback( () => {
		setHasMarkedSelfAsRead( response.id );
		markAsUnreadAction.callback( [ response ], { registry } );
	}, [ response, registry ] );
	const readUnreadButtons = (
		<>
			{ response.is_unread && (
				<Button
					variant="tertiary"
					onClick={ handleMarkAsRead }
					showTooltip={ true }
					label={ markAsReadAction.label }
					iconSize={ 24 }
					icon={ markAsReadAction.icon }
					size="compact"
				></Button>
			) }
			{ ! response.is_unread && (
				<Button
					variant="tertiary"
					onClick={ handleMarkAsUnread }
					showTooltip={ true }
					label={ markAsUnreadAction.label }
					iconSize={ 24 }
					icon={ markAsUnreadAction.icon }
					size="compact"
				></Button>
			) }
		</>
	);

	const renderActionButtons = () => {
		switch ( response.status ) {
			case 'spam':
				return (
					<>
						{ readUnreadButtons }
						<Button
							variant="tertiary"
							onClick={ handleMarkAsNotSpam }
							isBusy={ isMarkingAsNotSpam }
							showTooltip={ true }
							label={ markAsNotSpamAction.label }
							iconSize={ 24 }
							icon={ markAsNotSpamAction.icon }
							size="compact"
						></Button>
						<Button
							variant="tertiary"
							onClick={ handleMoveToTrash }
							isBusy={ isMovingToTrash }
							showTooltip={ true }
							label={ moveToTrashAction.label }
							iconSize={ 24 }
							icon={ moveToTrashAction.icon }
							size="compact"
						></Button>
					</>
				);

			case 'trash':
				return (
					<>
						{ readUnreadButtons }
						<Button
							variant="tertiary"
							onClick={ handleRestore }
							isBusy={ isRestoring }
							showTooltip={ true }
							label={ restoreAction.label }
							iconSize={ 24 }
							icon={ restoreAction.icon }
							size="compact"
						></Button>
						<Button
							variant="tertiary"
							onClick={ handleDelete }
							showTooltip={ true }
							isBusy={ isDeleting }
							label={ deleteAction.label }
							iconSize={ 24 }
							icon={ deleteAction.icon }
							size="compact"
						></Button>
					</>
				);

			default: // 'publish' (inbox) or any other status
				return (
					<>
						{ readUnreadButtons }
						<Button
							variant="tertiary"
							onClick={ handleMarkAsSpam }
							isBusy={ isMarkingAsSpam }
							showTooltip={ true }
							label={ markAsSpamAction.label }
							iconSize={ 24 }
							icon={ markAsSpamAction.icon }
							size="compact"
						></Button>
						<Button
							variant="tertiary"
							onClick={ handleMoveToTrash }
							isBusy={ isMovingToTrash }
							showTooltip={ true }
							label={ moveToTrashAction.label }
							iconSize={ 24 }
							icon={ moveToTrashAction.icon }
							size="compact"
						></Button>
					</>
				);
		}
	};

	const renderNavigationButtons = () => {
		return (
			<>
				{ onPrevious && (
					<Button
						accessibleWhenDisabled={ true }
						variant="tertiary"
						onClick={ onPrevious }
						disabled={ ! hasPrevious }
						showTooltip={ true }
						label={ __( 'Previous', 'jetpack-forms' ) }
						icon={ chevronLeft }
						size="compact"
					></Button>
				) }
				{ onNext && (
					<Button
						accessibleWhenDisabled={ true }
						variant="tertiary"
						onClick={ onNext }
						disabled={ ! hasNext }
						showTooltip={ true }
						label={ __( 'Next', 'jetpack-forms' ) }
						icon={ chevronRight }
						size="compact"
					></Button>
				) }
				{ ! isMobile && onClose && (
					<Button
						variant="tertiary"
						onClick={ onClose }
						showTooltip={ true }
						label={ __( 'Close', 'jetpack-forms' ) }
						icon={ close }
						size="compact"
					></Button>
				) }
			</>
		);
	};

	const renderFieldValue = value => {
		if ( isImageSelectField( value ) ) {
			return (
				<div className="image-select-field">
					{ ( value.choices?.length ?? 0 ) === 0 && '-' }
					{ ( value.choices?.length ?? 0 ) > 0 && (
						<>
							<div className="image-select-field-choices">
								{ value.choices
									.map( choice => {
										let transformedValue = choice.selected;

										if ( choice.label != null && choice.label !== '' ) {
											transformedValue += ' - ' + choice.label;
										}

										return transformedValue;
									} )
									.join( ', ' ) }
							</div>
							<div className="image-select-field-images">
								{ value.choices.map( choice => {
									return (
										<img
											key={ choice.selected }
											className="image-select-field-image"
											src={
												choice.image.src ||
												'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
											}
											alt={ choice.selected }
										/>
									);
								} ) }
							</div>
						</>
					) }
				</div>
			);
		}

		if ( isFileUploadField( value ) ) {
			return (
				<div className="file-field">
					{ value.files?.length
						? value.files.map( file => {
								if ( ! file || ! file.name ) {
									return '-';
								}
								return (
									<FileField
										file={ file }
										onClick={ handleFilePreview( file ) }
										key={ file.file_id }
									/>
								);
						  } )
						: '-' }
				</div>
			);
		}

		// Emails
		const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( emailRegEx.test( value ) ) {
			return (
				<div className="email-field">
					<a href={ `mailto:${ value }` }>{ value }</a>
					<CopyClipboardButton text={ value } />
				</div>
			);
		}

		// Phone numbers
		if ( isLikelyPhoneNumber( value ) ) {
			return (
				<div className="phone-field">
					<a href={ `tel:${ value }` }>{ value }</a>
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

	// Mark feedback as read when viewing
	useEffect( () => {
		if ( ! response || ! response.id || ! response.is_unread ) {
			setHasMarkedSelfAsRead( response.id );
			return;
		}
		if ( hasMarkedSelfAsRead === response.id ) {
			return;
		}

		setHasMarkedSelfAsRead( response.id );

		// Immediately update entity in store
		editEntityRecord( 'postType', 'feedback', response.id, {
			is_unread: false,
		} );

		// Immediately update menu counters optimistically to avoid delays
		if ( response.status === 'publish' ) {
			updateMenuCounterOptimistically( -1 );
		}

		// Then update on server
		apiFetch( {
			path: `/wp/v2/feedback/${ response.id }/read`,
			method: 'POST',
			data: { is_unread: false },
		} )
			.then( ( { count } ) => {
				// Update menu counter with accurate count from server
				updateMenuCounter( count );
			} )
			.catch( () => {
				// Revert the change in the store
				editEntityRecord( 'postType', 'feedback', response.id, {
					is_unread: true,
				} );

				// Revert the change in the sidebar
				if ( response.status === 'publish' ) {
					updateMenuCounterOptimistically( 1 );
				}
			} );
	}, [ response, editEntityRecord, hasMarkedSelfAsRead ] );

	const handelImageLoaded = useCallback( () => {
		return setIsImageLoading( false );
	}, [ setIsImageLoading ] );

	if ( ! loading && ! response ) {
		return null;
	}

	if ( isPreviewModalOpen && ! onModalStateChange ) {
		return (
			<PreviewFile
				file={ previewFile }
				isLoading={ isImageLoading }
				onImageLoaded={ handelImageLoaded }
			/>
		);
	}

	const displayName = getDisplayName( response );

	return (
		<>
			<HStack spacing="0" justify="space-between" className="jp-forms__inbox-response-actions">
				<HStack alignment="left">{ renderActionButtons() }</HStack>
				<HStack alignment="right">{ renderNavigationButtons() }</HStack>
			</HStack>
			<div ref={ ref } className="jp-forms__inbox-response">
				<div className="jp-forms__inbox-response-header">
					<HStack alignment="topLeft" spacing="3">
						{ response.author_email && (
							<Gravatar
								email={ response.author_email }
								displayName={ displayName }
								key={ response.author_email }
							/>
						) }
						<VStack spacing="0" className="jp-forms__inbox-response-header-title">
							<h3 className="jp-forms__inbox-response-name">{ displayName }</h3>
							{ response.author_email && displayName !== response.author_email && (
								<p className="jp-forms__inbox-response-email">
									<a href={ `mailto:${ response.author_email }` }>{ response.author_email }</a>
									<CopyClipboardButton text={ response.author_email } />
								</p>
							) }
						</VStack>
					</HStack>
				</div>

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

				<div className="jp-forms__inbox-response-data">
					{ Object.entries( response.fields ).map( ( [ key, value ] ) => (
						<div key={ key } className="jp-forms__inbox-response-item">
							<div className="jp-forms__inbox-response-data-label">
								{ key.endsWith( '?' ) ? key : `${ key }:` }
							</div>
							<div className="jp-forms__inbox-response-data-value">
								{ renderFieldValue( value ) }
							</div>
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
			{ response.status === 'spam' && (
				<Tip>{ __( 'Spam responses are moved to trash after 15 days.', 'jetpack-forms' ) }</Tip>
			) }
			{ response.status === 'trash' && (
				<Tip>
					{ sprintf(
						/* translators: %d number of days. */
						_n(
							'Items in trash are permanently deleted after %d day.',
							'Items in trash are permanently deleted after %d days.',
							emptyTrashDays,
							'jetpack-forms'
						),
						emptyTrashDays
					) }
				</Tip>
			) }
		</>
	);
};

export default InboxResponse;
