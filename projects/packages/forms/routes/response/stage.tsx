/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
/**
 * WordPress dependencies
 */
import {
	Modal,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams, useSearch } from '@wordpress/route';
import { Badge, Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import PreviewFile from '../../src/dashboard/components/inspector/preview-file';
import ResponseFieldsIterator from '../../src/dashboard/components/inspector/response-fields';
import ResponseMeta from '../../src/dashboard/components/inspector/response-meta';
import ResponseNavigation from '../../src/dashboard/components/inspector/response-navigation/index.tsx';
import { getDisplayName } from '../../src/dashboard/components/inspector/utils.ts';
import useMarkAsReadOnView from '../../src/dashboard/hooks/use-mark-as-read-on-view.ts';
import { useMarkAsSpam } from '../../src/dashboard/hooks/use-mark-as-spam.ts';
import FormsPage from '../../src/dashboard/wp-build/components/page';
import SingleResponseBreadcrumbs from './breadcrumbs.tsx';
import SingleResponseActions from './page-actions.tsx';
import getResponseQuery from './query.ts';
import repairResponseRecord from './repair-record.ts';
import useResponsePageNavigation from './use-navigation.ts';
// Shared wp-build dashboard chrome (page layout + breadcrumb link styling). The
// other dashboard routes load this; the single-response route needs it too so
// the breadcrumb matches the dashboard from first paint instead of flipping
// once these styles arrive via navigation.
import '../../src/dashboard/wp-build/style.scss';
import './style.scss';
/**
 * Types
 */
import type { DispatchActions, SelectActions } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FileItem, FormResponse } from '../../src/types/index.ts';

type PreviewFileItem = FileItem | { url: string; name: string };

/**
 * Header badge for a response that is no longer in the inbox.
 *
 * Inbox responses (`publish`) get no badge — the absence of one is the normal
 * state. Spam and trash are surfaced so that actioning a response from this page
 * (which keeps the user here) still shows where it landed.
 *
 * @param props        - Component props.
 * @param props.status - The response status.
 * @return The badge, or null for inbox responses.
 */
function ResponseStatusBadge( { status }: { status: FormResponse[ 'status' ] } ) {
	if ( status === 'spam' ) {
		return <Badge intent="high">{ __( 'Spam', 'jetpack-forms' ) }</Badge>;
	}

	if ( status === 'trash' ) {
		return <Badge intent="draft">{ __( 'Trash', 'jetpack-forms' ) }</Badge>;
	}

	return null;
}

/**
 * Standalone single response page (wp-build route).
 *
 * Renders one feedback response (meta + fields) as a full page at
 * `/response/$responseId`. Reached from the responses list's "View" row action.
 *
 * @return The single response page.
 */
function Stage(): React.JSX.Element {
	const params = useParams( { from: '/response/$responseId' } );
	const searchParams = useSearch( { from: '/response/$responseId' } );
	const navigate = useNavigate();
	const id = Number( params.responseId );
	const isValidId = Number.isFinite( id ) && id > 0;

	const { receiveEntityRecords } = useDispatch( coreStore ) as unknown as DispatchActions;
	const [ previewFile, setPreviewFile ] = useState< PreviewFileItem | null >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );

	const responseQuery = useMemo( () => getResponseQuery( id ), [ id ] );

	const { response, isLoading } = useSelect(
		select => {
			if ( ! isValidId ) {
				return { response: null, isLoading: false };
			}

			const core = select( coreStore );
			// Read the collection-format record and overlay any pending edits (e.g.
			// the optimistic "mark as read"). We avoid `getEditedEntityRecord`, which
			// resolves the canonical (query-less) record and refetches feedback
			// without `fields_format=collection`, overwriting the shared record and
			// stripping the rich field rendering.
			const records = core.getEntityRecords( 'postType', 'feedback', responseQuery ) as
				| FormResponse[]
				| null;
			const rawRecord = records?.[ 0 ];
			const edits = (
				core as unknown as {
					getEntityRecordEdits: ( k: string, n: string, i: number ) => object | undefined;
				}
			 ).getEntityRecordEdits( 'postType', 'feedback', id );

			return {
				response: rawRecord ? ( { ...rawRecord, ...edits } as unknown as FormResponse ) : null,
				isLoading: ( core as unknown as SelectActions ).isResolving( 'getEntityRecords', [
					'postType',
					'feedback',
					responseQuery,
				] ),
			};
		},
		[ id, isValidId, responseQuery ]
	);

	// For managed forms, resolve the actual jetpack_form post title so the
	// breadcrumb matches the header of the list it links to (response.entry_title
	// is the embedding page/post title, which can differ from the form's name).
	const formName = useSelect(
		select => {
			const formId = response?.form_id;
			if ( ! formId ) {
				return '';
			}
			const record = select( coreStore ).getEntityRecord( 'postType', 'jetpack_form', formId ) as
				| { title?: { rendered?: string } }
				| undefined;
			return record ? decodeEntities( record.title?.rendered || '' ) : '';
		},
		[ response?.form_id ]
	);

	// The email's "Mark as spam" button lands here with `?mark_as_spam=1`, which
	// opens a confirmation dialog — the destructive step is never taken on the
	// strength of a click in an email client alone. Same hook the responses list
	// inspector uses, so the copy and behaviour stay in one place.
	const clearMarkAsSpamParam = useCallback( () => {
		navigate( {
			search: { ...searchParams, mark_as_spam: undefined },
			replace: true,
		} );
	}, [ navigate, searchParams ] );

	const {
		isConfirmDialogOpen,
		onConfirmMarkAsSpam,
		onCancelMarkAsSpam,
		markAsSpamConfirmationMessage,
		isSaving,
	} = useMarkAsSpam( response, {
		checkParameter: () => ( searchParams as { mark_as_spam?: number } )?.mark_as_spam === 1,
		removeParameter: clearMarkAsSpamParam,
		switchToSpam: () => {
			// Unlike the list inspector, this page stays put, so the badge and menu
			// flip in place rather than the user being taken to the spam view.
			if ( response ) {
				repairResponseRecord( receiveEntityRecords, response, 'spam', responseQuery );
			}
			clearMarkAsSpamParam();
		},
	} );

	// The dialog's save and the menu's actions are separate mutation paths on one
	// response; this is the single in-flight signal both are gated on, so they can't
	// run against each other.
	const isMutating = isConfirmDialogOpen || isSaving;

	const { hasPrevious, hasNext, goPrevious, goNext } = useResponsePageNavigation( id );

	// Arrow keys move between responses, matching the inbox inspector. Ignore the
	// shortcut while typing in a field, when a modifier key is held, or while the
	// file-preview modal is open. Only preventDefault when navigation will
	// actually happen, so normal arrow-key page scrolling is preserved at the
	// list edges.
	useEffect( () => {
		const handleKeyDown = ( event: KeyboardEvent ) => {
			if ( event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey ) {
				return;
			}
			// Navigating away while the spam confirmation is open would leave the
			// dialog describing one response and confirming against another.
			if ( previewFile || isConfirmDialogOpen || isSaving ) {
				return;
			}
			const target = event.target as HTMLElement | null;
			const tag = target?.tagName;
			if (
				tag === 'INPUT' ||
				tag === 'TEXTAREA' ||
				tag === 'SELECT' ||
				target?.isContentEditable
			) {
				return;
			}
			if ( event.key === 'ArrowUp' && hasPrevious ) {
				event.preventDefault();
				goPrevious();
			} else if ( event.key === 'ArrowDown' && hasNext ) {
				event.preventDefault();
				goNext();
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );
		return () => window.removeEventListener( 'keydown', handleKeyDown );
	}, [ goPrevious, goNext, hasPrevious, hasNext, previewFile, isConfirmDialogOpen, isSaving ] );

	// Mark the response as read when it is viewed, keeping the admin-menu unread
	// counter in sync. The shared hook latches on a ref, which also survives the
	// "Mark as unread" menu item on this page re-running the effect.
	useMarkAsReadOnView( response );

	const handleFilePreview = useCallback(
		( file: PreviewFileItem ) => () => {
			setIsImageLoading( true );
			setPreviewFile( file );
		},
		[]
	);
	const closePreviewModal = useCallback( () => {
		setPreviewFile( null );
		setIsImageLoading( true );
	}, [] );
	const handleImageLoaded = useCallback( () => setIsImageLoading( false ), [] );

	// Keep the breadcrumb (with the "Forms" link) on the loading/not-found states
	// so the user can always navigate back to the responses list and reorient.
	const renderMessagePage = ( currentLabel: string, ariaLabel: string, child: React.ReactNode ) => (
		<FormsPage
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			breadcrumbs={ <SingleResponseBreadcrumbs currentLabel={ currentLabel } /> }
			ariaLabel={ ariaLabel }
			showFooter={ false }
		>
			<div className="jp-forms__single-response-message">{ child }</div>
		</FormsPage>
	);

	if ( isValidId && isLoading ) {
		return renderMessagePage(
			isValidId ? `#${ id }` : __( 'Response', 'jetpack-forms' ),
			__( 'Response', 'jetpack-forms' ),
			<Spinner />
		);
	}

	if ( ! response ) {
		return renderMessagePage(
			isValidId ? `#${ id }` : __( 'Not found', 'jetpack-forms' ),
			__( 'Response not found', 'jetpack-forms' ),
			<p>{ __( 'This response could not be found.', 'jetpack-forms' ) }</p>
		);
	}

	const dateSettings = getDateSettings();
	const displayName = getDisplayName( response );
	const formTitle = decodeEntities( response.entry_title || '' );
	const subTitle = `${ displayName } · ${ dateI18n( dateSettings.formats.date, response.date ) }`;

	return (
		<FormsPage
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			breadcrumbs={
				<SingleResponseBreadcrumbs response={ response } formTitle={ formName || formTitle } />
			}
			badges={ <ResponseStatusBadge status={ response.status } /> }
			subTitle={ subTitle }
			ariaLabel={ displayName }
			actions={
				<Stack
					direction="row"
					gap="sm"
					justify="end"
					wrap="wrap"
					className="jp-forms__single-response-actions"
				>
					<ResponseNavigation
						hasNext={ hasNext && ! isMutating }
						hasPrevious={ hasPrevious && ! isMutating }
						onNext={ goNext }
						onPrevious={ goPrevious }
						onClose={ null }
					/>
					<SingleResponseActions response={ response } isBlocked={ isMutating } />
				</Stack>
			}
			showFooter={ false }
		>
			<div className="jp-forms__single-response">
				<div className="jp-forms__single-response-card">
					<ResponseMeta response={ response } />

					<ResponseFieldsIterator fields={ response.fields } onFilePreview={ handleFilePreview } />
				</div>
			</div>

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
		</FormsPage>
	);
}

export { Stage as stage };
