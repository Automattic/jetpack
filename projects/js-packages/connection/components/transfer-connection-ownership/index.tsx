/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import OwnerCandidateList from './candidate-list';
import TransferConfirmStep from './confirm-step';
import TransferDoneStep from './done-step';
import useOwnershipTransfer from './use-ownership-transfer';

export type { ConnectionOwnerCandidate } from './use-ownership-transfer';

export interface TransferConnectionOwnershipProps {
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Called as soon as WordPress.com accepts the new owner. */
	onTransferred?: ( newOwnerId: number ) => void;
	/** Called whenever the user leaves. Omit to hide the dismiss action. */
	onDismiss?: () => void;
	/** Label for the dismiss action, for a surface the user is returning to. */
	dismissLabel?: string;
}

/**
 * Hand this site's WordPress.com connection to another connected administrator.
 *
 * Carries the whole choose → confirm → done flow and its own actions.
 *
 * @param {TransferConnectionOwnershipProps} props - Component props.
 * @return {import('react').ReactNode} The TransferConnectionOwnership component.
 */
const TransferConnectionOwnership = ( {
	apiRoot,
	apiNonce,
	onTransferred,
	onDismiss,
	dismissLabel,
}: TransferConnectionOwnershipProps ) => {
	const {
		candidates,
		selectedId,
		setSelectedId,
		selectedCandidate,
		step,
		confirm,
		back,
		transfer,
		isTransferring,
		error,
	} = useOwnershipTransfer( { apiRoot, apiNonce, onTransferred } );

	const hasCandidates = !! candidates?.length;
	// True only of the connection owner, who is the person transferring: hence "you're".
	const isProtectedOwner = !! getScriptData()?.connection?.hasProtectedOwner;

	if ( 'done' === step && selectedCandidate ) {
		return (
			<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership-form">
				<TransferDoneStep candidate={ selectedCandidate } />

				<Stack direction="row" align="center" justify="flex-end" gap="sm">
					{ onDismiss && (
						<Button variant="solid" onClick={ onDismiss }>
							{ __( 'Done', 'jetpack-connection-js' ) }
						</Button>
					) }
				</Stack>
			</Stack>
		);
	}

	if ( 'confirm' === step && selectedCandidate ) {
		// "anyway" acknowledges the warning above it on a protected-owner site.
		let confirmLabel: string = __( 'Transfer ownership', 'jetpack-connection-js' );
		if ( isProtectedOwner ) {
			confirmLabel = __( 'Transfer anyway', 'jetpack-connection-js' );
		}

		return (
			<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership-form">
				<TransferConfirmStep
					candidate={ selectedCandidate }
					isProtectedOwner={ isProtectedOwner }
					error={ error }
				/>

				<Stack direction="row" align="center" justify="flex-end" gap="sm">
					<Button variant="minimal" onClick={ back } disabled={ isTransferring }>
						{ __( 'Back', 'jetpack-connection-js' ) }
					</Button>
					<Button
						variant="solid"
						onClick={ transfer }
						loading={ isTransferring }
						loadingAnnouncement={ __( 'Transferring ownership…', 'jetpack-connection-js' ) }
					>
						{ confirmLabel }
					</Button>
				</Stack>
			</Stack>
		);
	}

	// Separate statements, not a ternary — see the note in candidate-list.tsx.
	let defaultDismissLabel: string = __( 'Close', 'jetpack-connection-js' );
	if ( hasCandidates ) {
		defaultDismissLabel = __( 'Cancel', 'jetpack-connection-js' );
	}

	return (
		<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership-form">
			<OwnerCandidateList
				candidates={ candidates }
				selectedId={ selectedId }
				onSelect={ setSelectedId }
				error={ error }
			/>

			<Stack direction="row" align="center" justify="flex-end" gap="sm">
				{ onDismiss && (
					<Button variant={ hasCandidates ? 'minimal' : 'outline' } onClick={ onDismiss }>
						{ dismissLabel || defaultDismissLabel }
					</Button>
				) }
				{ hasCandidates && (
					<Button variant="solid" onClick={ confirm } disabled={ ! selectedId }>
						{ __( 'Continue', 'jetpack-connection-js' ) }
					</Button>
				) }
			</Stack>
		</Stack>
	);
};

export default TransferConnectionOwnership;
