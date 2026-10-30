import { getUserConnectionUrl, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { Button, Link, Stack } from '@wordpress/ui';
import { MyJetpackRoutes } from '../../constants';
import { getMyJetpackRouteUrl } from '../../utils/route-href';
import type { ConnectionState } from '../../hooks/use-connection-state';
import type { FC } from 'react';

/**
 * The state's one action, as the Overview's connection card offers it.
 *
 * @param props               - Component props.
 * @param props.action        - The action from the connection state.
 * @param props.repairActions - The connection package's own fixes for a live error.
 * @return The action, or null when the state has none the header can run.
 */
const PrimaryAction: FC< {
	action: ConnectionState[ 'action' ];
	repairActions: ReturnType< typeof useConnectionErrorNotice >[ 'actions' ];
} > = ( { action, repairActions } ) => {
	if ( action === 'CONNECT_USER' ) {
		return (
			<Link href={ getUserConnectionUrl() }>
				{ __( 'Connect my account', 'jetpack-my-jetpack' ) }
			</Link>
		);
	}

	if ( action === 'CONNECT_SITE' ) {
		return (
			<Link href={ getMyJetpackRouteUrl( MyJetpackRoutes.Connection ) }>
				{ __( 'Connect site', 'jetpack-my-jetpack' ) }
			</Link>
		);
	}

	if ( action === 'REPAIR' ) {
		return (
			<Stack direction="row" wrap="wrap" gap="sm">
				{ repairActions.map( ( errorAction, index ) => (
					<Button
						key={ errorAction.label }
						variant={ index === 0 ? 'solid' : 'outline' }
						size="compact"
						onClick={ errorAction.onClick }
						loading={ errorAction.isLoading }
						loadingAnnouncement={
							errorAction.loadingText || __( 'Loading…', 'jetpack-my-jetpack' )
						}
					>
						{ errorAction.label }
					</Button>
				) ) }
			</Stack>
		);
	}

	return null;
};

export default PrimaryAction;
