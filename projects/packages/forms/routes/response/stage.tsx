/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Modal, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import PreviewFile from '../../src/dashboard/components/inspector/preview-file';
import ResponseFieldsIterator from '../../src/dashboard/components/inspector/response-fields';
import ResponseMeta from '../../src/dashboard/components/inspector/response-meta';
import ResponseNavigation from '../../src/dashboard/components/inspector/response-navigation/index.tsx';
import { getDisplayName } from '../../src/dashboard/components/inspector/utils.ts';
import FormsPage from '../../src/dashboard/wp-build/components/page';
import SingleResponseBreadcrumbs from './breadcrumbs.tsx';
import SingleResponseActions from './page-actions.tsx';
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

// Stable query reference so the value passed to `isResolving` matches the one
// used by `getEntityRecord` (and the route loader).
const RESPONSE_QUERY = { fields_format: 'collection' };

type PreviewFileItem = FileItem | { url: string; name: string };

/**
 * Standalone single response page (wp-build route).
 *
 * Renders one feedback response (meta + fields) as a full page at
 * `/response/$responseId`. Not linked from anywhere yet.
 *
 * @return The single response page.
 */
function Stage(): React.JSX.Element {
	const params = useParams( { from: '/response/$responseId' } );
	const id = Number( params.responseId );
	const isValidId = Number.isFinite( id ) && id > 0;

	const { editEntityRecord } = useDispatch( coreStore ) as unknown as DispatchActions;
	const [ markedReadId, setMarkedReadId ] = useState< number | null >( null );
	const [ previewFile, setPreviewFile ] = useState< PreviewFileItem | null >( null );
	const [ isImageLoading, setIsImageLoading ] = useState( true );

	const { response, isLoading } = useSelect(
		select => {
			if ( ! isValidId ) {
				return { response: null, isLoading: false };
			}

			const core = select( coreStore );
			// Read the collection-format record directly and overlay any pending
			// edits (e.g. the optimistic "mark as read"). We avoid
			// `getEditedEntityRecord`, which resolves the canonical (query-less)
			// record and refetches feedback without `fields_format=collection`,
			// overwriting the shared record and stripping the rich field rendering.
			const rawRecord = core.getEntityRecord( 'postType', 'feedback', id, RESPONSE_QUERY );
			const edits = (
				core as unknown as {
					getEntityRecordEdits: ( k: string, n: string, i: number ) => object | undefined;
				}
			 ).getEntityRecordEdits( 'postType', 'feedback', id );

			return {
				response: rawRecord ? ( { ...rawRecord, ...edits } as unknown as FormResponse ) : null,
				isLoading: ( core as unknown as SelectActions ).isResolving( 'getEntityRecord', [
					'postType',
					'feedback',
					id,
					RESPONSE_QUERY,
				] ),
			};
		},
		[ id, isValidId ]
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
			if ( previewFile ) {
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
	}, [ goPrevious, goNext, hasPrevious, hasNext, previewFile ] );

	// Mark the response as read when it is viewed.
	useEffect( () => {
		if ( ! response || ! response.id || ! response.is_unread ) {
			return;
		}
		if ( markedReadId === response.id ) {
			return;
		}

		setMarkedReadId( response.id );
		editEntityRecord( 'postType', 'feedback', response.id, { is_unread: false } );

		apiFetch( {
			path: `/wp/v2/feedback/${ response.id }/read`,
			method: 'POST',
			data: { is_unread: false },
		} ).catch( () => {
			editEntityRecord( 'postType', 'feedback', response.id, { is_unread: true } );
		} );
	}, [ response, editEntityRecord, markedReadId ] );

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
						hasNext={ hasNext }
						hasPrevious={ hasPrevious }
						onNext={ goNext }
						onPrevious={ goPrevious }
						onClose={ null }
					/>
					<SingleResponseActions response={ response } />
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
		</FormsPage>
	);
}

export { Stage as stage };
