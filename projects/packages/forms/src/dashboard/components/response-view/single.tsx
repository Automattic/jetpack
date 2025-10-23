import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	Modal,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useResponseNavigation from '../../hooks/use-response-navigation';
import ResponseActions from '../response-actions';
import ResponseNavigation from '../response-navigation';
import { ResponseViewBody } from './index';

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
	const [ isModalOpen, setIsModalOpen ] = useState( true );

	const onRequestClose = useCallback( () => {
		if ( ! isChildModalOpen ) {
			onChangeSelection?.( [] );
		}

		if ( isMobile ) {
			setIsModalOpen( false );
		}
	}, [ onChangeSelection, isChildModalOpen, setIsModalOpen, isMobile ] );

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
	} );

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

	if ( ! isMobile ) {
		return (
			<div className="jp-forms__inbox__dataviews-response">
				<HStack spacing="0" justify="space-between" className="jp-forms__inbox-response-actions">
					<HStack alignment="left">
						<ResponseActions onActionComplete={ handleActionComplete } response={ sidePanelItem } />
					</HStack>
					<HStack alignment="right">
						<ResponseNavigation { ...navigationProps } onClose={ onRequestClose } />
					</HStack>
				</HStack>
				{ contents }
			</div>
		);
	}

	if ( ! isModalOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Response', 'jetpack-forms' ) }
			size="medium"
			onRequestClose={ onRequestClose }
			headerActions={
				<>
					<ResponseActions response={ sidePanelItem } onActionComplete={ handleActionComplete } />
					<ResponseNavigation { ...navigationProps } onClose={ null } />
				</>
			}
		>
			{ contents }
		</Modal>
	);
};
export default SingleResponseView;
