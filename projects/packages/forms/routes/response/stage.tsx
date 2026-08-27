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
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _x } from '@wordpress/i18n';
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
import { getPinnedView } from './pinned-view.ts';
import getResponseQuery from './query.ts';
import repairResponseRecord from './repair-record.ts';
import useResponseKeyboardShortcuts, { SHORTCUTS } from './use-keyboard-shortcuts.ts';
import useResponsePageNavigation from './use-navigation.ts';
import useResponseActions from './use-response-actions.ts';
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
		return <Badge intent="high">{ _x( 'Spam', 'response status', 'jetpack-forms' ) }</Badge>;
	}

	if ( status === 'trash' ) {
		return <Badge intent="draft">{ _x( 'Trash', 'response status', 'jetpack-forms' ) }</Badge>;
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

	// The list this response was opened from. Prev/next walks it, the breadcrumb
	// links back to it, and Escape returns to it. See `pinned-view.ts`.
	const pinned = useMemo( () => getPinnedView( searchParams ), [ searchParams ] );

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

	// One set of action handlers for both the three-dot menu and the keyboard, so a
	// shortcut cannot bypass the re-entry guard or the store repair a status change
	// from this page depends on.
	const responseActions = useResponseActions( response, pinned, id );

	// Navigation is deliberately *not* gated on `isPending`. Marking a run of spam is
	// the main thing this page is used for, and waiting for each request to land
	// before the arrows come back makes that crawl. A status change is safe to walk
	// away from: it targets the response captured when it started, and repairs that
	// record's own cache entry when it lands, whichever response is on screen by then.
	//
	// The confirmation dialog is different — it is modal and describes one specific
	// response, so moving underneath it would leave it confirming against another.
	const isNavigationBlocked = isConfirmDialogOpen || isSaving;

	const { hasPrevious, hasNext, goPrevious, goNext } = useResponsePageNavigation( id, pinned );

	// Escape both closes the actions menu and backs out to the list, so the menu's
	// open state has to suspend the shortcuts — otherwise dismissing the menu would
	// navigate away at the same time.
	const [ isActionsMenuOpen, setIsActionsMenuOpen ] = useState( false );

	// Keyboard shortcuts for triage: move through the list, file a response away,
	// get back to the list. Suspended while a modal is open or a mutation is in
	// flight — navigating away mid-change would leave the spam dialog describing one
	// response and confirming against another.
	//
	// `onNext`/`onPrevious` are left unbound at the ends of the list rather than
	// bound to a no-op, so the arrow keys still scroll the page there.
	useResponseKeyboardShortcuts(
		{
			onNext: hasNext ? goNext : undefined,
			onPrevious: hasPrevious ? goPrevious : undefined,
			onMarkAsSpam: responseActions.markAsSpam,
			onMoveToTrash: responseActions.moveToTrash,
			onGoToList: responseActions.goToList,
		},
		{
			isDisabled: Boolean( previewFile ) || isActionsMenuOpen || isNavigationBlocked,
		}
	);

	// Mark the response as read when it is viewed, keeping the admin-menu unread
	// counter in sync. The shared hook latches on a ref, which also survives the
	// "Mark as unread" menu item on this page re-running the effect.
	useMarkAsReadOnView( response );

	// Arrives from the list's Print action. `window.print()` blocks, so it must not
	// fire while the page is still a spinner. The ref is keyed by id because
	// prev/next moves between responses without remounting this route.
	const hasPrintRequest = ( searchParams as { print?: number } )?.print === 1;
	const printedForIdRef = useRef< number | null >( null );

	useEffect( () => {
		if ( ! hasPrintRequest || ! response || isLoading || printedForIdRef.current === id ) {
			return;
		}

		printedForIdRef.current = id;

		// Deliberately untimed: a deferred print would be cancelled when this effect
		// re-runs, and `useEffect` already runs after the response is in the DOM.
		window.print();

		// `print()` blocks, so by here the dialog is closed. Drop the flag so a
		// reload doesn't reprint.
		navigate( {
			search: { ...searchParams, print: undefined },
			replace: true,
		} );
	}, [ hasPrintRequest, response, isLoading, id, navigate, searchParams ] );

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
			breadcrumbs={ <SingleResponseBreadcrumbs currentLabel={ currentLabel } pinned={ pinned } /> }
			ariaLabel={ ariaLabel }
			showFooter={ false }
		>
			<div className="jp-forms__single-response-message">{ child }</div>
		</FormsPage>
	);

	// Only show the spinner when there is nothing to show. Every status change
	// invalidates `getEntityRecords` resolutions (see `invalidateCacheAndNavigate`),
	// which re-resolves this page's own query — without the `! response` guard the
	// response would be replaced by a full-page spinner on each action, which is
	// exactly what staying on the page is meant to avoid.
	if ( isValidId && isLoading && ! response ) {
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
				<SingleResponseBreadcrumbs
					response={ response }
					formTitle={ formName || formTitle }
					pinned={ pinned }
				/>
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
						hasNext={ hasNext && ! isNavigationBlocked }
						hasPrevious={ hasPrevious && ! isNavigationBlocked }
						onNext={ goNext }
						onPrevious={ goPrevious }
						nextShortcut={ SHORTCUTS.next.shortcut }
						previousShortcut={ SHORTCUTS.previous.shortcut }
						onClose={ null }
					/>
					<SingleResponseActions
						response={ response }
						responseActions={ responseActions }
						// Combined in the menu with `responseActions.isPending`, so a second
						// action can't be started on a response already changing.
						isBlocked={ isNavigationBlocked }
						onOpenChange={ setIsActionsMenuOpen }
					/>
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
