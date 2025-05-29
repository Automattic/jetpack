import { __, sprintf } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { ConnectionIssueTooltip } from './connection-issue-tooltip';

/**
 * Component to display the connection owner information.
 *
 * @return The connection owner information or null if not applicable.
 */
export function ConnectionOwnerInfo() {
	const { userConnectionData, isUserConnected, hasConnectedOwner } = useMyJetpackConnection();

	if ( ! isUserConnected && ! hasConnectedOwner ) {
		return null;
	}

	const displayName = userConnectionData.currentUser?.wpcomUser?.display_name || '';
	const email = userConnectionData.currentUser?.wpcomUser?.email || '';
	const isOwner = userConnectionData.currentUser?.isMaster;

	return (
		<ul>
			{ isUserConnected ? (
				<li>
					{ isOwner ? (
						<>
							{ displayName
								? sprintf(
										/* translators: 1 is user name, 2 is email address */
										__( 'Connected as owner: %1$s (%2$s)', 'jetpack-my-jetpack' ),
										displayName,
										email
								  )
								: __( 'User connected (Owner).', 'jetpack-my-jetpack' ) }
						</>
					) : (
						<>
							{ displayName
								? sprintf(
										/* translators: 1 is user name, 2 is email address */
										__( 'Connected as %1$s (%2$s)', 'jetpack-my-jetpack' ),
										displayName,
										email
								  )
								: __( 'User connected.', 'jetpack-my-jetpack' ) }
						</>
					) }
					<ConnectionIssueTooltip />
				</li>
			) : null }
			{ ! isOwner && userConnectionData?.connectionOwner ? (
				<li>
					{ sprintf(
						/* translators: placeholder is the username of the Jetpack connection owner */
						__( 'Also connected: %s (Owner).', 'jetpack-my-jetpack' ),
						userConnectionData.connectionOwner
					) }
				</li>
			) : null }
		</ul>
	);
}
