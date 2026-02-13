/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useEmptyTrash from '../../hooks/use-empty-trash';
import EmptyTrashConfirmationModal from './confirmation-modal';

interface EmptyTrashButtonProps {
	totalItemsTrash?: number;
	isLoadingCounts?: boolean;
}

/**
 * Renders a button to empty form responses.
 *
 * @param {object}  props                 - Component props.
 * @param {number}  props.totalItemsTrash - The total number of trash items (optional, will use hook if not provided).
 * @param {boolean} props.isLoadingCounts - Whether counts are loading (optional, will use hook if not provided).
 * @return {JSX.Element} The empty trash button.
 */
const EmptyTrashButton = ( {
	totalItemsTrash: totalItemsTrashProp,
	isLoadingCounts: isLoadingCountsProp,
}: EmptyTrashButtonProps = {} ): JSX.Element => {
	const {
		isConfirmDialogOpen,
		openConfirmDialog,
		closeConfirmDialog,
		onConfirmEmptying,
		isEmpty,
		isEmptying,
		totalItemsTrash,
		selectedResponsesCount,
	} = useEmptyTrash( {
		totalItemsTrash: totalItemsTrashProp,
		isLoadingCounts: isLoadingCountsProp,
	} );

	return (
		<>
			<Button
				size="compact"
				accessibleWhenDisabled
				disabled={ isEmpty || isEmptying }
				icon={ trash }
				isBusy={ isEmptying }
				label={ isEmpty ? __( 'Trash is already empty.', 'jetpack-forms' ) : '' }
				onClick={ openConfirmDialog }
				showTooltip={ isEmpty }
				variant="primary"
			>
				{ __( 'Empty trash', 'jetpack-forms' ) }
			</Button>
			<EmptyTrashConfirmationModal
				isOpen={ isConfirmDialogOpen }
				onCancel={ closeConfirmDialog }
				onConfirm={ onConfirmEmptying }
				totalItemsTrash={ totalItemsTrash }
				selectedResponsesCount={ selectedResponsesCount }
			/>
		</>
	);
};

export default EmptyTrashButton;
