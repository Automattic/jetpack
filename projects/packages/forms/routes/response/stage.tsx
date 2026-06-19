/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
/**
 * WordPress dependencies
 */
import { Breadcrumbs } from '@wordpress/admin-ui';
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
import { getDisplayName } from '../../src/dashboard/components/inspector/utils.ts';
import FormsPage from '../../src/dashboard/wp-build/components/page';
import SingleResponseActions from './page-actions.tsx';
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
 * Renders one feedback response (meta + fields + response ID) as a full page at
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
			const rawRecord = core.getEntityRecord( 'postType', 'feedback', id, RESPONSE_QUERY );

			return {
				response: rawRecord
					? ( core.getEditedEntityRecord( 'postType', 'feedback', id ) as unknown as FormResponse )
					: null,
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

	const renderMessagePage = ( title: string, child: React.ReactNode ) => (
		<FormsPage
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			title={ title }
			ariaLabel={ title }
			showFooter={ false }
		>
			<Stack direction="row" justify="center" style={ { padding: '40px' } }>
				{ child }
			</Stack>
		</FormsPage>
	);

	if ( isValidId && isLoading ) {
		return renderMessagePage( __( 'Response', 'jetpack-forms' ), <Spinner /> );
	}

	if ( ! response ) {
		return renderMessagePage(
			__( 'Response not found', 'jetpack-forms' ),
			<p>{ __( 'This response could not be found.', 'jetpack-forms' ) }</p>
		);
	}

	const dateSettings = getDateSettings();
	const displayName = getDisplayName( response );
	const formTitle = decodeEntities( response.entry_title || '' );
	const subTitle = `${ displayName } · ${ dateI18n( dateSettings.formats.date, response.date ) }`;

	const breadcrumbItems = [
		{ label: __( 'Forms', 'jetpack-forms' ), to: '/responses/inbox' },
		...( formTitle ? [ { label: formTitle } ] : [] ),
		{ label: `#${ response.id }` },
	];

	return (
		<FormsPage
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			breadcrumbs={ <Breadcrumbs items={ breadcrumbItems } /> }
			subTitle={ subTitle }
			ariaLabel={ displayName }
			actions={ <SingleResponseActions response={ response } /> }
			showFooter={ false }
		>
			<div className="jp-forms__single-response">
				<div className="jp-forms__single-response-card">
					<ResponseMeta response={ response } />

					<ResponseFieldsIterator fields={ response.fields } onFilePreview={ handleFilePreview } />

					<div className="jp-forms__single-response-id">
						<div className="jp-forms__single-response-id-label">
							{ __( 'Response ID', 'jetpack-forms' ) }
						</div>
						<div className="jp-forms__single-response-id-value">{ response.id }</div>
					</div>
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
