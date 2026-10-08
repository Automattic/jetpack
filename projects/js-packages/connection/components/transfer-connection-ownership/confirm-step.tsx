/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { AvatarBadge } from './candidate-identity';
import './style.scss';
import type { ConnectionOwnerCandidate } from './use-ownership-transfer';

export interface TransferConfirmStepProps {
	/** The administrator about to become the owner. */
	candidate: ConnectionOwnerCandidate;
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
	isProtectedOwner,
	error,
}: TransferConfirmStepProps ) => {
	const currentOwnerName = getScriptData()?.user?.current_user?.display_name ?? '';

	return (
		<div className="jp-connection__transfer-ownership">
			<div className="jp-connection__transfer-ownership__handover">
				{ currentOwnerName && (
					<>
						<AvatarBadge name={ currentOwnerName } />
						<span className="jp-connection__transfer-ownership__arrow" aria-hidden="true">
							&rarr;
						</span>
					</>
				) }
				<AvatarBadge name={ candidate.displayName } />
				<Text>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: display name of the administrator taking over. */
							__( '<name>%s</name> will become the connection owner.', 'jetpack-connection-js' ),
							candidate.displayName
						),
						{ name: <strong /> }
					) }
				</Text>
			</div>

			<ul className="jp-connection__transfer-ownership__outcomes">
				<li>
					{ sprintf(
						/* translators: %s: display name of the administrator taking over. */
						__(
							"%s's WordPress.com account will power site-level features.",
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
						__(
							'Site-level features keep running under the new owner. <link>Learn about connection ownership</link>',
							'jetpack-connection-js'
						),
						{
							link: (
								<Link
									openInNewTab
									href={ getRedirectUrl(
										'why-the-wordpress-com-connection-is-important-for-jetpack'
									) }
								/>
							),
						}
					) }
				</Notice.Description>
			</Notice.Root>

			{ error && (
				<Text render={ <p /> } className="jp-connection__transfer-ownership__error">
					{ error }
				</Text>
			) }
		</div>
	);
};

export default TransferConfirmStep;
