import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { useSearchParams } from 'react-router';
import useResponseNavigation from '../../hooks/use-response-navigation.ts';
import { store as dashboardStore } from '../../store/index.js';
import Page from '../page/index.tsx';
import ResponseActions from '../response-actions/index.tsx';
import ResponseNavigation from '../response-navigation/index.tsx';
import { ResponseViewBody } from './index.tsx';

/**
 * Single response component for dataviews.
 * It might return a modal when viewport is resized to mobile.
 *
 * @param {object}       props               - The props object.
 * @param {boolean}      props.isLoadingData - Whether the data is loading.
 * @param {boolean}      props.isMobile      - Whether the view is mobile.
 * @param {FormResponse} props.response      - The response to display.
 * @return {import('react').JSX.Element} The single response component.
 */
const SingleResponseView = ( { isLoadingData, isMobile, response } ) => {
	const [ , setSearchParams ] = useSearchParams();
	const [ isChildModalOpen, setIsChildModalOpen ] = useState( false );
	const { closeResponse } = useDispatch( dashboardStore );

	// Update URL param `r` with items
	const updateSearchParam = useCallback(
		items => {
			setSearchParams( previousSearchParams => {
				const _searchParams = new URLSearchParams( previousSearchParams );
				if ( items.length ) {
					_searchParams.set( 'r', items.join( ',' ) );
				} else {
					_searchParams.delete( 'r' );
				}
				return _searchParams;
			} );
		},
		[ setSearchParams ]
	);

	const onRequestClose = useCallback( () => {
		if ( ! isChildModalOpen ) {
			closeResponse();
			// Remove `r` URL param
			updateSearchParam( [] );
		}
	}, [ closeResponse, isChildModalOpen ] );

	const handleModalStateChange = useCallback(
		isOpen => {
			setIsChildModalOpen( isOpen );
		},
		[ setIsChildModalOpen ]
	);

	const handleActionComplete = useCallback(
		actionedItem => {
			// if the action is on current response and hasn't changed status,
			// don't close the modal
			if ( actionedItem?.id === response?.id && actionedItem.status === response?.status ) {
				// Response status hasn't changed, keep it open
				return;
			}
			// If actioned item is the current response, close it
			if ( actionedItem?.id === response?.id ) {
				closeResponse();
			}
		},
		[ closeResponse, response ]
	);

	// Use the navigation hook
	const navigation = useResponseNavigation( {
		record: response,
	} );

	// Add keyboard navigation using refs to avoid re-registering listeners
	const handleNextRef = useRef( navigation.handleNext );
	const handlePreviousRef = useRef( navigation.handlePrevious );
	const hasNextRef = useRef( navigation.hasNext );
	const hasPreviousRef = useRef( navigation.hasPrevious );
	const onRequestCloseRef = useRef( onRequestClose );

	// Update refs when values change
	useEffect( () => {
		handleNextRef.current = navigation.handleNext;
		handlePreviousRef.current = navigation.handlePrevious;
		hasNextRef.current = navigation.hasNext;
		hasPreviousRef.current = navigation.hasPrevious;
		onRequestCloseRef.current = onRequestClose;
	} );

	// Register keyboard event listener only once
	useEffect( () => {
		const handleKeyDown = event => {
			// Prevent default behavior for arrow keys to avoid scrolling
			if ( event.key === 'ArrowUp' || event.key === 'ArrowDown' ) {
				event.preventDefault();
			}

			if ( event.key === 'ArrowUp' && hasPreviousRef.current ) {
				handlePreviousRef.current();
			} else if ( event.key === 'ArrowDown' && hasNextRef.current ) {
				handleNextRef.current();
			} else if ( event.key === 'Escape' ) {
				onRequestCloseRef.current();
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );

		return () => {
			window.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [] ); // Empty dependencies - listener registered only once

	if ( ! response ) {
		return null;
	}

	// Navigation props to pass to InboxResponse and ResponseNavigation
	const navigationProps = {
		hasNext: navigation.hasNext,
		hasPrevious: navigation.hasPrevious,
		onNext: navigation.handleNext,
		onPrevious: navigation.handlePrevious,
	};

	const contents = (
		<ResponseViewBody
			response={ response }
			isLoading={ isLoadingData }
			onModalStateChange={ handleModalStateChange }
		/>
	);

	return (
		<Page showSidebarToggle={ false } hasPadding={ false }>
			<div className="jp-forms-response-content">
				<HStack
					spacing="0"
					justify="space-between"
					className="jp-forms-response-actions"
					style={ { width: 'auto' } }
				>
					<ResponseActions
						onActionComplete={ handleActionComplete }
						response={ response }
						variant="text"
					/>
					<ResponseNavigation { ...navigationProps } onClose={ onRequestClose } />
				</HStack>
				{ contents }
			</div>
		</Page>
	);
};
export default SingleResponseView;
