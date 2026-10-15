/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { AvatarBadge } from './candidate-identity';
import './style.scss';
import type { ConnectionOwnerCandidate } from './use-ownership-transfer';
import type { ConnectionOwner } from '../../types';

export interface TransferConfirmStepProps {
	/** The administrator about to become the owner. */
	candidate: ConnectionOwnerCandidate;
	/** The administrator handing ownership over. */
	currentOwner?: ConnectionOwner | null;
	/** Whether the current owner is also this connection's protected owner. */
	isProtectedOwner?: boolean;
	/** A failed transfer's message, if any. */
	error?: string;
}

/**
 * What changes once the transfer goes through, shown before it is committed.
 *
 * @param {TransferConfirmStepProps} props - Component props.
 * @return {import('react').ReactNode} The TransferConfirmStep component.
 */
const TransferConfirmStep = ( {
	candidate,
	currentOwner,
	isProtectedOwner,
	error,
}: TransferConfirmStepProps ) => {
	// A third party can blank an avatar URL through the get_avatar_url filter, and half a
	// handover reads as broken: show both faces or neither.
	const showHandover = Boolean( currentOwner?.avatar && candidate.avatar );

	return (
		<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership">
			<Stack
				direction="row"
				align="center"
				gap="md"
				className="jp-connection__transfer-ownership__handover"
			>
				{ showHandover && (
					<>
						<AvatarBadge avatar={ currentOwner?.avatar } />
						<span className="jp-connection__transfer-ownership__arrow" aria-hidden="true">
							&rarr;
						</span>
						<AvatarBadge avatar={ candidate.avatar } />
					</>
				) }
				<Text>
					{ createInterpolateElement(
						/* translators: <name/> is replaced with the display name of the administrator taking over. */
						__( '<name/> will become the connection owner.', 'jetpack-connection-js' ),
						{ name: <strong>{ candidate.displayName }</strong> }
					) }
				</Text>
			</Stack>

			<ul className="jp-connection__transfer-ownership__outcomes">
				<li>
					{ sprintf(
						/* translators: %s: display name of the administrator taking over. */
						__(
							'%s will own the data WordPress.com stores for this site.',
							'jetpack-connection-js'
						),
						candidate.displayName
					) }
				</li>
				<li>{ __( "You'll stay connected as a regular user.", 'jetpack-connection-js' ) }</li>
				{ isProtectedOwner && (
					<li>
						{ sprintf(
							/* translators: %s: display name of the administrator taking over. */
							__( '%s needs to confirm protected ownership.', 'jetpack-connection-js' ),
							candidate.displayName
						) }
					</li>
				) }
			</ul>

			{ isProtectedOwner && (
				<Notice.Root intent="warning">
					<Notice.Title>
						{ __( "You're the protected owner of this connection", 'jetpack-connection-js' ) }
					</Notice.Title>
					<Notice.Description>
						{ sprintf(
							/* translators: %s: display name of the administrator taking over. */
							__(
								'After the transfer, features that need a protected owner stop working until %s confirms they are the new protected owner.',
								'jetpack-connection-js'
							),
							candidate.displayName
						) }
					</Notice.Description>
				</Notice.Root>
			) }

			<Notice.Root intent="info">
				<Notice.Description>
					{ createInterpolateElement(
						/* translators: <name/> is replaced with the display name of the administrator taking over. */
						__(
							'<name/> also becomes the main point of contact for support about that data. <link>Learn about the connection owner</link>',
							'jetpack-connection-js'
						),
						{
							name: <strong>{ candidate.displayName }</strong>,
							link: <Link openInNewTab href={ getRedirectUrl( 'jetpack-support-primary-user' ) } />,
						}
					) }
				</Notice.Description>
			</Notice.Root>

			{ /* A Notice rather than styled text: it arrives after an async failure, and
			     Notice announces itself so the user is not left waiting on nothing. */ }
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
		</Stack>
	);
};

export default TransferConfirmStep;
