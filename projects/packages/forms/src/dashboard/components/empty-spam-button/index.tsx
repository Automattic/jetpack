/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useEmptySpam from '../../hooks/use-empty-spam';
import EmptySpamConfirmationModal from './confirmation-modal';

interface EmptySpamButtonProps {
	totalItemsSpam?: number;
}

/**
 * Renders a button to empty form responses.
 *
 * @param {object} props                - Component props.
 * @param {number} props.totalItemsSpam - The total number of spam items (optional, will use hook if not provided).
 * @return {JSX.Element} The empty spam button.
 */
const EmptySpamButton = ( {
	totalItemsSpam: totalItemsSpamProp,
}: EmptySpamButtonProps = {} ): JSX.Element => {
	const {
		isConfirmDialogOpen,
		openConfirmDialog,
		closeConfirmDialog,
		onConfirmEmptying,
		isEmpty,
		isEmptying,
		totalItemsSpam,
		selectedResponsesCount,
	} = useEmptySpam( {
		totalItemsSpam: totalItemsSpamProp,
	} );

	return (
		<>
			<Button
				size="compact"
				accessibleWhenDisabled
				disabled={ isEmpty || isEmptying }
				icon={ trash }
				isBusy={ isEmptying }
				label={ isEmpty ? __( 'Spam is already empty.', 'jetpack-forms' ) : '' }
				onClick={ openConfirmDialog }
				showTooltip={ isEmpty }
				variant="primary"
			>
				{ __( 'Delete spam', 'jetpack-forms' ) }
			</Button>
			<EmptySpamConfirmationModal
				isOpen={ isConfirmDialogOpen }
				onCancel={ closeConfirmDialog }
				onConfirm={ onConfirmEmptying }
				totalItemsSpam={ totalItemsSpam }
				selectedResponsesCount={ selectedResponsesCount }
			/>
		</>
	);
};

export default EmptySpamButton;
