/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
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
import { useDispatch } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { download, image } from '@wordpress/icons';
import clsx from 'clsx';
import photon from 'photon';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';
import CopyClipboardButton from '../../components/copy-clipboard-button';
import Gravatar from '../../components/gravatar';
import useInboxData from '../../hooks/use-inbox-data';
import { useMarkAsSpam } from '../../hooks/use-mark-as-spam';
import {
	getPath,
	updateMenuCounter,
	updateMenuCounterOptimistically,
	getCountryFlagEmoji,
} from '../../inbox/utils';
import { store as dashboardStore } from '../../store';
import type { FormResponse } from '../../../types';

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

export type ResponseViewBodyProps = {
	response: FormResponse;
	isLoading: boolean;
	onModalStateChange?: ( toggleOpen: boolean ) => void;
	isMobile?: boolean;
};

/**
 * Renders the dashboard response view.
 *
 * @param {object}   props                    - The props object.
 * @param {object}   props.response           - The response item.
 * @param {boolean}  props.isLoading          - Whether the response is loading.
 * @param {Function} props.onModalStateChange - Function to update the modal state.
 * @return {import('react').JSX.Element} The dashboard response view.
 */
const ResponseViewBody = ( {
	response,
	isLoading,
	onModalStateChange,
}: ResponseViewBodyProps ): import('react').JSX.Element => {
	const { currentQuery } = useInboxData();
	const [ isPreviewModalOpen, setIsPreviewModalOpen ] = useState( false );
	const [ previewFile, setPreviewFile ] = useState< null | object >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );
	const [ hasMarkedSelfAsRead, setHasMarkedSelfAsRead ] = useState( 0 );

	const { editEntityRecord } = useDispatch( 'core' );

	const emptyTrashDays = useConfigValue( 'emptyTrashDays' ) ?? 0;

	// When opening a "Mark as spam" link from the email, the ResponseViewBody component is rendered, so we use a hook here to handle it.
	const { isConfirmDialogOpen, onConfirmMarkAsSpam, onCancelMarkAsSpam } = useMarkAsSpam(
		response as FormResponse
	);

	const { invalidateCounts, markRecordsAsInvalid } = useDispatch( dashboardStore );

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
		if ( isImageSelectField( value ) ) {
			return (
				<div className="image-select-field">
					{ ( value.choices?.length ?? 0 ) === 0 && '-' }
					{ ( value.choices?.length ?? 0 ) > 0 && (
						<VStack spacing="1">
							{ value.choices.map( choice => {
								const label = choice.label
									? `${ choice.selected }: ${ choice.label }`
									: choice.selected;
								const hasImage = choice.image?.src;
								return (
									<Button
										__next40pxDefaultSize
										key={ choice.selected }
										variant="tertiary"
										onClick={
											hasImage
												? handleFilePreview( {
														file_id: choice.image.id,
														name: label,
														url: choice.image.src,
												  } )
												: undefined
										}
										className="image-select-field-button"
										icon={
											hasImage ? (
												<img
													alt={ choice.selected }
													className="image-select-field-image"
													loading="lazy"
													src={ photon( choice.image.src, { width: 120, height: 120 } ) }
												/>
											) : (
												image
											)
										}
										iconSize={ 60 }
									>
										{ label }
									</Button>
								);
							} ) }
						</VStack>
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
			.then( ( { count }: { count: number } ) => {
				// Update menu counter with accurate count from server
				updateMenuCounter( count );
				// Mark record as invalid instead of removing from view
				markRecordsAsInvalid( [ response.id ] );
				// invalidate counts to refresh the counts across all status tabs
				invalidateCounts();
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
	}, [
		response,
		editEntityRecord,
		hasMarkedSelfAsRead,
		invalidateCounts,
		markRecordsAsInvalid,
		currentQuery,
	] );

	const handelImageLoaded = useCallback( () => {
		return setIsImageLoading( false );
	}, [ setIsImageLoading ] );

	if ( ! isLoading && ! response ) {
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
					<table>
						<tbody>
							<tr>
								<th>{ __( 'Date:', 'jetpack-forms' ) }</th>
								<td>
									{ sprintf(
										/* Translators: %1$s is the date, %2$s is the time. */
										__( '%1$s at %2$s', 'jetpack-forms' ),
										dateI18n( getDateSettings().formats.date, response.date ),
										dateI18n( getDateSettings().formats.time, response.date )
									) }
								</td>
							</tr>
							<tr>
								<th>{ __( 'Source:', 'jetpack-forms' ) }</th>
								<td>
									<ExternalLink href={ response.entry_permalink }>
										{ decodeEntities( response.entry_title ) || getPath( response ) }
									</ExternalLink>
								</td>
							</tr>
							<tr>
								<th>{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;</th>
								<td>
									{ response.country_code && (
										<span className="jp-forms__inbox-response-meta-country-flag response-country-flag">
											{ getCountryFlagEmoji( response.country_code ) }
										</span>
									) }
									<Tooltip text={ __( 'Lookup IP address', 'jetpack-forms' ) }>
										<ExternalLink href={ getRedirectUrl( 'ip-lookup', { path: response.ip } ) }>
											{ response.ip }
										</ExternalLink>
									</Tooltip>
								</td>
							</tr>
							{ response.browser && (
								<tr>
									<th>{ __( 'Browser:', 'jetpack-forms' ) }&nbsp;</th>
									<td>{ response.browser }</td>
								</tr>
							) }
						</tbody>
					</table>
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
						title={ decodeEntities( ( previewFile as { name: string } ).name ) }
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

export default ResponseViewBody;
