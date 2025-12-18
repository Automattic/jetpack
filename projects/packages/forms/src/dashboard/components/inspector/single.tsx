import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import useResponseNavigation from '../../hooks/use-response-navigation.ts';
import Page from '../page/index.tsx';
import ResponseActions from '../response-actions/index.tsx';
import ResponseNavigation from '../response-navigation/index.tsx';
import { ResponseViewBody } from './index.tsx';

/**
 * Single response component for dataviews.
 * It might return a modal when viewport is resized to mobile.
 * @param {object}       props                   - The props object.
 * @param {FormResponse} props.sidePanelItem     - The side panel item.
 * @param {Function}     props.setSidePanelItem  - The function to set the side panel item.
 * @param {boolean}      props.isLoadingData     - Whether the data is loading.
 * @param {boolean}      props.isMobile          - Whether the view is mobile.
 * @param {Function}     props.onChangeSelection - The function to change the selection.
 * @param {string[]}     props.selection         - The selection.
 * @return {import('react').JSX.Element} The single response component.
 */
const SingleResponseView = ( {
	sidePanelItem,
	setSidePanelItem,
	isLoadingData,
	isMobile,
	onChangeSelection,
	selection,
} ) => {
	const [ isChildModalOpen, setIsChildModalOpen ] = useState( false );

	const onRequestClose = useCallback( () => {
		if ( ! isChildModalOpen ) {
			onChangeSelection?.( [] );
		}
	}, [ onChangeSelection, isChildModalOpen ] );

	const handleModalStateChange = useCallback(
		isOpen => {
			setIsChildModalOpen( isOpen );
		},
		[ setIsChildModalOpen ]
	);

	const handleActionComplete = useCallback(
		actionedItem => {
			// if the action is on current response and hasn't changed status,
			// don't close the modal but update the side panel item
			if ( actionedItem?.id === sidePanelItem.id && actionedItem.status === sidePanelItem.status ) {
				setSidePanelItem( actionedItem );
			} else if ( actionedItem?.id && selection ) {
				// Remove only the actioned item from selection, keep the rest
				const actionedItemId = String( actionedItem.id );
				const newSelection = selection.filter( id => id !== actionedItemId );
				onChangeSelection?.( newSelection );
			}
		},
		[ onChangeSelection, selection, sidePanelItem, setSidePanelItem ]
	);

	// Use the navigation hook
	const navigation = useResponseNavigation( {
		onChangeSelection,
		record: sidePanelItem,
		setRecord: setSidePanelItem,
		isMobile,
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

	if ( ! sidePanelItem ) {
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
			response={ sidePanelItem }
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
						response={ sidePanelItem }
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
