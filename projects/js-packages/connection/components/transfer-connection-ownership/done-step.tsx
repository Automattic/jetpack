/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import CandidateIdentity from './candidate-identity';
import './style.scss';
import type { ConnectionOwnerCandidate } from './use-ownership-transfer';

export interface TransferDoneStepProps {
	/** The administrator who now owns the connection. */
	candidate: ConnectionOwnerCandidate;
}

/**
 * Confirmation that WordPress.com accepted the new owner.
 *
 * @param {TransferDoneStepProps} props - Component props.
 * @return {import('react').ReactNode} The TransferDoneStep component.
 */
const TransferDoneStep = ( { candidate }: TransferDoneStepProps ) => (
	<div className="jp-connection__transfer-ownership">
		<CandidateIdentity
			avatar={ candidate.avatar }
			displayName={ candidate.displayName }
			login={ candidate.login }
			email={ candidate.email }
		/>

		<Notice.Root intent="success">
			<Notice.Description>
				{ sprintf(
					/* translators: %s: display name of the new connection owner. */
					__(
						"%s is now the connection owner. You're still connected as a regular user.",
						'jetpack-connection-js'
					),
					candidate.displayName
				) }
			</Notice.Description>
		</Notice.Root>
	</div>
);

export default TransferDoneStep;
