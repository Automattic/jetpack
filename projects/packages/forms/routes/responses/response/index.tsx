/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Modal,
	Spinner,
	Tip,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import FeedbackComments from '../../../src/dashboard/components/feedback-comments';
import PreviewFile from '../../../src/dashboard/components/inspector/preview-file';
import ResponseFieldsIterator from '../../../src/dashboard/components/inspector/response-fields';
import ResponseMeta from '../../../src/dashboard/components/inspector/response-meta';
import useInboxData from '../../../src/dashboard/hooks/use-inbox-data.ts';
import { useMarkAsSpam } from '../../../src/dashboard/hooks/use-mark-as-spam.ts';
import useConfigValue from '../../../src/hooks/use-config-value.ts';
import { ResponseActions } from './actions';
import { ResponseNavigation } from './navigation';
import type { DispatchActions, SelectActions } from '../../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../../src/types/index.ts';
import './style.scss';

/**
 * Renders a single response.
 *
 * @param props                - Props used while rendering a single response.
 * @param props.responseId     - The ID of the response to render.
 * @param props.allResponseIds - The IDs of all responses.
 * @param props.onNavigate     - Callback fired when the response is navigated.
 * @param props.onClose        - Callback fired when the response is closed.
 *
 * @return                     - Element containing the single response.
 */
function SingleResponseView( {
	responseId,
	allResponseIds,
	onNavigate,
	onClose,
}: {
	responseId: number;
	allResponseIds: number[];
	onNavigate: ( id: number ) => void;
	onClose: () => void;
} ) {
	const [ previewFile, setPreviewFile ] = useState< { url: string; name: string } | null >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );
	const [ hasMarkedAsRead, setHasMarkedAsRead ] = useState< number | null >( null );

	const emptyTrashDays = useConfigValue( 'emptyTrashDays' ) ?? 0;
	const isNotesEnabled = useConfigValue( 'isNotesEnabled' ) ?? false;

	const { editEntityRecord } = useDispatch( coreStore ) as unknown as DispatchActions;
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/responses/$view' } );

	const { response, isLoading } = useSelect(
		select => {
			if ( ! responseId ) {
				return { response: null, isLoading: false };
			}

			return {
				response: select( coreStore ).getEditedEntityRecord(
					'postType',
					'feedback',
					responseId
				) as unknown as FormResponse | null,
				isLoading: ( select( coreStore ) as unknown as SelectActions ).isResolving(
					'getEntityRecord',
					[ 'postType', 'feedback', responseId ]
				),
			};
		},
		[ responseId ]
	);

	// Use the mark as spam hook with wp-build specific callbacks
	const {
		isConfirmDialogOpen,
		onConfirmMarkAsSpam,
		onCancelMarkAsSpam,
		markAsSpamConfirmationMessage,
		isSaving,
	} = useMarkAsSpam( response as FormResponse | null, {
		checkParameter: () => searchParams?.mark_as_spam === 1,
		removeParameter: () => {
			navigate( {
				search: {
					...searchParams,
					mark_as_spam: undefined,
				},
			} );
		},
		switchToSpam: ( id: number | string ) => {
			navigate( {
				to: '/responses/spam',
				search: {
					...searchParams,
					responseIds: [ String( id ) ],
					mark_as_spam: undefined,
				},
			} );
		},
	} );

	const currentIndex = allResponseIds.indexOf( responseId );
	const hasNext = currentIndex < allResponseIds.length - 1;
	const hasPrevious = currentIndex > 0;

	const handleNext = useCallback( () => {
		if ( hasNext ) {
			onNavigate( allResponseIds[ currentIndex + 1 ] );
		}
	}, [ hasNext, allResponseIds, currentIndex, onNavigate ] );

	const handlePrevious = useCallback( () => {
		if ( hasPrevious ) {
			onNavigate( allResponseIds[ currentIndex - 1 ] );
		}
	}, [ hasPrevious, allResponseIds, currentIndex, onNavigate ] );

	// Keyboard navigation
	useEffect( () => {
		const handleKeyDown = ( event: KeyboardEvent ) => {
			if ( event.key === 'ArrowUp' && hasPrevious ) {
				event.preventDefault();
				handlePrevious();
			} else if ( event.key === 'ArrowDown' && hasNext ) {
				event.preventDefault();
				handleNext();
			} else if ( event.key === 'Escape' ) {
				onClose();
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );
		return () => window.removeEventListener( 'keydown', handleKeyDown );
	}, [ hasNext, hasPrevious, handleNext, handlePrevious, onClose ] );

	// Mark as read when viewing
	useEffect( () => {
		if ( ! response || ! response.id || ! response.is_unread ) {
			return;
		}
		if ( hasMarkedAsRead === response.id ) {
			return;
		}

		setHasMarkedAsRead( response.id );

		editEntityRecord( 'postType', 'feedback', response.id, {
			is_unread: false,
		} );

		apiFetch( {
			path: `/wp/v2/feedback/${ response.id }/read`,
			method: 'POST',
			data: { is_unread: false },
		} ).catch( () => {
			editEntityRecord( 'postType', 'feedback', response.id, {
				is_unread: true,
			} );
		} );
	}, [ response, editEntityRecord, hasMarkedAsRead ] );

	const handleFilePreview = useCallback(
		( file: { url: string; name: string } ) => () => {
			setIsImageLoading( true );
			setPreviewFile( file );
		},
		[]
	);

	const closePreviewModal = useCallback( () => {
		setPreviewFile( null );
		setIsImageLoading( true );
	}, [] );

	const handleImageLoaded = useCallback( () => {
		setIsImageLoading( false );
	}, [] );

	const handleActionComplete = useCallback(
		( updatedItem: FormResponse | null ) => {
			if ( ! updatedItem ) {
				if ( hasNext ) {
					handleNext();
				} else if ( hasPrevious ) {
					handlePrevious();
				} else {
					onClose();
				}
			}
		},
		[ hasNext, hasPrevious, handleNext, handlePrevious, onClose ]
	);

	if ( isLoading ) {
		return (
			<Stack direction="row" justify="center" style={ { padding: '40px' } }>
				<Spinner />
			</Stack>
		);
	}

	if ( ! response ) {
		return (
			<Stack direction="row" justify="center" style={ { padding: '40px' } }>
				<p>{ __( 'Response not found.', 'jetpack-forms' ) }</p>
			</Stack>
		);
	}

	return (
		<>
			<Stack className="jp-forms-response-header" direction="row" gap="xs" justify="space-between">
				<ResponseActions response={ response } onActionComplete={ handleActionComplete } />
				<ResponseNavigation
					hasNext={ hasNext }
					hasPrevious={ hasPrevious }
					onNext={ handleNext }
					onPrevious={ handlePrevious }
					onClose={ onClose }
				/>
			</Stack>

			<ResponseMeta response={ response } />

			<ResponseFieldsIterator fields={ response.fields } onFilePreview={ handleFilePreview } />

			{ isNotesEnabled && <FeedbackComments postId={ response.id } /> }

			{ response.status === 'spam' && (
				<div className="jp-forms__inbox__tip-container">
					<Tip>
						{ sprintf(
							/* translators: %d number of days. */
							_n(
								'Spam responses are permanently deleted after %d day.',
								'Spam responses are permanently deleted after %d days.',
								15,
								'jetpack-forms'
							),
							// Number from https://github.com/Automattic/jetpack/blob/bde3cf9a89ce0d02e50469df173a6253383bd276/projects/packages/forms/src/contact-form/class-contact-form-plugin.php#L132
							15
						) }
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

			{ previewFile && (
				<Modal title={ decodeEntities( previewFile.name ) } onRequestClose={ closePreviewModal }>
					<PreviewFile
						file={ previewFile }
						isLoading={ isImageLoading }
						onImageLoaded={ handleImageLoaded }
					/>
				</Modal>
			) }

			<ConfirmDialog
				isOpen={ isConfirmDialogOpen }
				onConfirm={ onConfirmMarkAsSpam }
				onCancel={ onCancelMarkAsSpam }
				isBusy={ isSaving }
			>
				{ markAsSpamConfirmationMessage }
			</ConfirmDialog>
		</>
	);
}

/**
 * Renders the response contents for inspector panel.
 *
 * @return - Element containing response contents.
 */
export default function Response() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const responseIds = searchParams?.responseIds || [];
	const statusView = params.view === 'spam' || params.view === 'trash' ? params.view : 'inbox';

	const { records } = useInboxData( { status: statusView } );
	const allRecordIds = records?.map( record => record.id ) ?? [];

	const handleClose = useCallback( () => {
		navigate( {
			search: {
				...searchParams,
				responseIds: undefined,
			},
		} );
	}, [ navigate, searchParams ] );

	const handleNavigate = useCallback(
		( id: number ) => {
			navigate( {
				search: {
					...searchParams,
					responseIds: [ String( id ) ],
				},
			} );
		},
		[ navigate, searchParams ]
	);

	if ( responseIds.length !== 1 ) {
		return null;
	}

	const selectedResponseId = Number( responseIds[ 0 ] );

	return (
		<SingleResponseView
			responseId={ selectedResponseId }
			allResponseIds={ allRecordIds }
			onNavigate={ handleNavigate }
			onClose={ handleClose }
		/>
	);
}
