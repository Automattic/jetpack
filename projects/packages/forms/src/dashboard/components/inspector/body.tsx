/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Modal,
	Tip,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import useInboxData from '../../hooks/use-inbox-data.ts';
import { useMarkAsSpam } from '../../hooks/use-mark-as-spam.ts';
import { updateMenuCounter, updateMenuCounterOptimistically } from '../../inbox/utils.js';
import { store as dashboardStore } from '../../store/index.js';
import FeedbackComments from '../feedback-comments/index.tsx';
import FieldEmail from '../response-view/field-email/index.tsx';
import FieldFile from '../response-view/field-file/index.tsx';
import FieldImageSelect from '../response-view/field-image-select/index.tsx';
import FieldPreview from '../response-view/field-preview/index.tsx';
import PreviewFile from './preview-file';
import ResponseMeta from './response-meta';
import {
	isCollectionFormatField,
	isFileUploadField,
	isImageSelectField,
	isLikelyPhoneNumber,
} from './utils';
import type { FormResponse, ResponseField } from '../../../types/index.ts';
import './style.scss';

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
	const [ previewFile, setPreviewFile ] = useState< { url: string; name: string } | null >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );
	const [ hasMarkedSelfAsRead, setHasMarkedSelfAsRead ] = useState( 0 );

	const { editEntityRecord } = useDispatch( 'core' );

	const emptyTrashDays = useConfigValue( 'emptyTrashDays' ) ?? 0;
	const isNotesEnabled = useConfigValue( 'isNotesEnabled' ) ?? false;

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
			return <FieldImageSelect choices={ value.choices } handleFilePreview={ handleFilePreview } />;
		}

		// File uploads
		if ( isFileUploadField( value ) ) {
			return <FieldFile files={ value?.files } handleFilePreview={ handleFilePreview } />;
		}

		// Emails
		const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( emailRegEx.test( value ) ) {
			return <FieldEmail email={ value } />;
		}

		// Phone numbers
		if ( isLikelyPhoneNumber( value ) ) {
			return <a href={ `tel:${ value }` }>{ value }</a>;
		}

		return value;
	};

	// Determine format synchronously to avoid render timing issues.
	// Handles both true arrays and objects with numeric keys (from PHP JSON encoding).
	const fieldsAreNewFormat = useMemo( () => {
		if ( Array.isArray( response.fields ) ) {
			// Any array value represents the new format, even when empty.
			if ( response.fields.length === 0 ) {
				return true;
			}
			return isCollectionFormatField( response.fields[ 0 ] );
		}

		// Guard against null/undefined and non-object values before using Object.values.
		if ( ! response.fields || typeof response.fields !== 'object' ) {
			return false;
		}

		// Object with numeric keys - check first value.
		const values = Object.values( response.fields );
		return values.length > 0 && isCollectionFormatField( values[ 0 ] );
	}, [ response.fields ] );

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

	const responseDataClass = clsx( 'jp-forms__inbox-response-data', {
		'is-collection-format': fieldsAreNewFormat,
	} );

	// Mobile doesn't render a modal, so we render the preview file directly.
	if ( isPreviewModalOpen && ! onModalStateChange && previewFile ) {
		return (
			<PreviewFile
				file={ previewFile }
				isLoading={ isImageLoading }
				onImageLoaded={ handelImageLoaded }
			/>
		);
	}

	return (
		<>
			<div ref={ ref } className="jp-forms__inbox-response">
				<ResponseMeta response={ response } />

				<div className={ responseDataClass }>
					{ ! fieldsAreNewFormat &&
						Object.entries( response.fields ).map( ( [ key, value ] ) => (
							<div key={ key } className="jp-forms__inbox-response-item">
								<div className="jp-forms__inbox-response-data-label">
									{ key.endsWith( '?' ) ? key : `${ key }:` }
								</div>
								<div className="jp-forms__inbox-response-data-value">
									{ renderFieldValue( value ) }
								</div>
							</div>
						) ) }
					{ fieldsAreNewFormat &&
						( Array.isArray( response.fields )
							? response.fields
							: ( Object.values( response.fields ) as ResponseField[] )
						).map( field => (
							<FieldPreview key={ field.key } field={ field } onFilePreview={ handleFilePreview } />
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
			{ /* Comments section */ }

			{ isNotesEnabled && <FeedbackComments postId={ response.id } /> }
			{ response.status === 'spam' && (
				<div className="jp-forms__inbox__tip-container">
					<Tip>
						{ __( 'Spam responses are permanently deleted after 15 days.', 'jetpack-forms' ) }
					</Tip>
				</div>
			) }
			{ response.status === 'trash' && (
				<div className="jp-forms__inbox__tip-container">
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
				</div>
			) }
		</>
	);
};

export default ResponseViewBody;
