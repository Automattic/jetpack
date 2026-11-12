/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getDeletingLabel } from '../../hooks/use-empty-responses';
import useEmptySpam, { type EmptySpamScope } from '../../hooks/use-empty-spam';
import DeletingSpinner from '../deleting-spinner';
import EmptySpamConfirmationModal from './confirmation-modal';
import type { JSX } from 'react';

interface EmptySpamButtonProps {
	totalItemsSpam?: number;
}

/**
 * Label for the button showing the count of affected responses.
 *
 * @param scope - Current scope descriptor from the hook.
 * @return Localized label.
 */
export function labelForScope( scope: EmptySpamScope ): string {
	if ( scope.mode === 'all' ) {
		return __( 'Delete spam', 'jetpack-forms' );
	}
	return sprintf(
		/* translators: %s: The number of spam responses that will be deleted. */
		__( 'Delete spam (%s)', 'jetpack-forms' ),
		formatNumber( scope.count )
	);
}

/**
 * Renders the "Delete spam" button, which adapts to the current scope
 * (selection → filter → all spam) and opens the confirmation modal.
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
		progress,
		scope,
	} = useEmptySpam( {
		totalItemsSpam: totalItemsSpamProp,
	} );

	return (
		<>
			<Button
				size="compact"
				accessibleWhenDisabled
				disabled={ isEmpty || isEmptying }
				icon={ progress ? <DeletingSpinner /> : trash }
				isBusy={ isEmptying && ! progress }
				aria-busy={ isEmptying }
				label={ isEmpty ? __( 'Spam is already empty.', 'jetpack-forms' ) : '' }
				onClick={ openConfirmDialog }
				showTooltip={ isEmpty }
				variant="primary"
			>
				{ progress ? getDeletingLabel( progress ) : labelForScope( scope ) }
			</Button>
			<EmptySpamConfirmationModal
				isOpen={ isConfirmDialogOpen }
				onCancel={ closeConfirmDialog }
				onConfirm={ onConfirmEmptying }
				scopeMode={ scope.mode }
				count={ scope.count }
			/>
		</>
	);
};

export default EmptySpamButton;
