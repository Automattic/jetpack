/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import {
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { EmptySpamScopeMode } from '../../hooks/use-empty-spam';

interface EmptySpamConfirmationModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	scopeMode: EmptySpamScopeMode;
	count: number;
}

/**
 * Produces the count-forward dialog title based on scope mode.
 *
 * @param mode  - The scope the action will operate on.
 * @param count - Number of responses affected.
 * @return Translated title string.
 */
function titleForScope( mode: EmptySpamScopeMode, count: number ): string {
	const formatted = formatNumber( count );
	switch ( mode ) {
		case 'selection':
			return sprintf(
				/* translators: %s: The number of selected spam responses. */
				_n(
					'Delete %s selected spam response?',
					'Delete %s selected spam responses?',
					count,
					'jetpack-forms'
				),
				formatted
			);
		case 'filtered':
			return sprintf(
				/* translators: %s: The number of spam responses matching the current filter. */
				_n(
					'Delete %s matching spam response?',
					'Delete %s matching spam responses?',
					count,
					'jetpack-forms'
				),
				formatted
			);
		case 'all':
		default:
			return sprintf(
				/* translators: %s: The total number of spam responses. */
				_n( 'Delete %s spam response?', 'Delete all %s spam responses?', count, 'jetpack-forms' ),
				formatted
			);
	}
}

/**
 * Confirmation modal for the "Delete spam" button.
 *
 * @param  props           - Component props.
 * @param  props.isOpen    - Whether the modal is open.
 * @param  props.onCancel  - Function to call when the user cancels.
 * @param  props.onConfirm - Function to call when the user confirms.
 * @param  props.scopeMode - Which scope the action will use.
 * @param  props.count     - Number of responses that will be affected.
 * @return {JSX.Element} The confirmation modal.
 */
export default function EmptySpamConfirmationModal( {
	isOpen,
	onCancel,
	onConfirm,
	scopeMode,
	count,
}: EmptySpamConfirmationModalProps ): JSX.Element {
	return (
		<ConfirmDialog
			onCancel={ onCancel }
			onConfirm={ onConfirm }
			isOpen={ isOpen }
			size="medium"
			confirmButtonText={ __( 'Delete forever', 'jetpack-forms' ) }
		>
			<VStack spacing={ 4 }>
				<Heading level={ 3 }>{ titleForScope( scopeMode, count ) }</Heading>
				<Text>{ __( 'This action cannot be undone.', 'jetpack-forms' ) }</Text>
			</VStack>
		</ConfirmDialog>
	);
}
