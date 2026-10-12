/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import OwnerCandidateList from './candidate-list';
import TransferConfirmStep from './confirm-step';
import TransferDoneStep from './done-step';
import useOwnershipTransfer from './use-ownership-transfer';

export type { ConnectionOwnerCandidate } from './use-ownership-transfer';

type StoreSelector = ( storeId: string ) => Record< string, ( ...args: unknown[] ) => unknown >;

export interface TransferConnectionOwnershipProps {
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Called as soon as WordPress.com accepts the new owner. */
	onTransferred?: ( newOwnerId: number ) => void;
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
	const isProtectedOwner = useSelect(
		( select: StoreSelector ) => !! select( STORE_ID ).getHasProtectedOwner(),
		[]
	);

	if ( 'done' === step && selectedCandidate ) {
		return (
			<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership-form">
				<TransferDoneStep candidate={ selectedCandidate } />
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

	return (
		<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership-form">
			<OwnerCandidateList
				candidates={ candidates }
				selectedId={ selectedId }
				onSelect={ setSelectedId }
				error={ error }
			/>

			{ hasCandidates && (
				<Stack direction="row" align="center" justify="flex-end" gap="sm">
					<Button variant="solid" onClick={ confirm } disabled={ ! selectedId }>
						{ __( 'Continue', 'jetpack-connection-js' ) }
					</Button>
				</Stack>
			) }
		</Stack>
	);
};

export default TransferConnectionOwnership;
