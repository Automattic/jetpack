/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import ResponseViewBody from '../../../src/dashboard/components/inspector/body';
import { ResponseActions } from './actions';
import { ResponseNavigation } from './navigation';
import type { DispatchActions, SelectActions } from '../../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../../src/types/index.ts';

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
	const [ hasMarkedAsRead, setHasMarkedAsRead ] = useState< number | null >( null );

	const { editEntityRecord } = useDispatch( coreStore ) as DispatchActions;

	const { response, isLoading } = useSelect(
		select => {
			if ( ! responseId ) {
				return { response: null, isLoading: false };
			}

			return {
				response: ( select( coreStore ) as SelectActions ).getEntityRecord(
					'postType',
					'feedback',
					responseId
				) as unknown as FormResponse | null,
				isLoading: ( select( coreStore ) as SelectActions ).isResolving( 'getEntityRecord', [
					'postType',
					'feedback',
					responseId,
				] ),
			};
		},
		[ responseId ]
	);

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

	return (
		<>
			<div
				style={ {
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '8px 16px',
					borderBottom: '1px solid #e0e0e0',
					gap: '8px',
					flexWrap: 'wrap',
				} }
			>
				{ response && (
					<ResponseActions response={ response } onActionComplete={ handleActionComplete } />
				) }
				<ResponseNavigation
					hasNext={ hasNext }
					hasPrevious={ hasPrevious }
					onNext={ handleNext }
					onPrevious={ handlePrevious }
					onClose={ onClose }
				/>
			</div>
			{ response && <ResponseViewBody response={ response } isLoading={ isLoading } /> }
			{ ! response && <p>{ __( 'Response not found.', 'jetpack-forms' ) } </p> }
		</>
	);
}

/**
 * Renders the inspector for responses.
 *
 * @return - Element containing the inspector for responses.
 */
export default function Inspector() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const responseIds = searchParams?.responseIds || [];

	// Determine the status based on the current view
	let status = 'publish';
	if ( params.view === 'spam' ) {
		status = 'spam';
	} else if ( params.view === 'trash' ) {
		status = 'trash';
	}

	// Fetch all visible records using the same query as the stage
	// This leverages core-data's cache, so records loaded by stage are reused
	const { records } = useEntityRecords< FormResponse >( 'postType', 'feedback', {
		status,
		per_page: 20,
		page: 1,
		orderby: 'date',
		order: 'desc',
	} );

	// Get all record IDs for navigation
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
		<Page showSidebarToggle={ false } hasPadding={ false }>
			<SingleResponseView
				responseId={ selectedResponseId }
				allResponseIds={ allRecordIds }
				onNavigate={ handleNavigate }
				onClose={ handleClose }
			/>
		</Page>
	);
}
