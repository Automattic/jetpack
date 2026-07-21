import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { currentUserCan } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';
import { Button, Card, EmptyState } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import ConnectionManagement from '../connection-management';
import { ThemedConnectionsModal } from '../manage-connections-modal';
import TrafficChartCard from './traffic-chart-card';
import './style.scss';

/**
 * Friendly empty state shown inside the Connected-accounts card when
 * the site has zero Publicize connections. The primary action mirrors
 * the page-header "Add account" button so users can finish onboarding
 * without scrolling.
 *
 * @return The empty-state body.
 */
const NoConnectionsEmptyState = () => {
	const { openConnectionsModal } = useDispatch( socialStore );

	return (
		<div className="jetpack-social-overview__empty">
			<EmptyState.Root>
				<EmptyState.Icon icon={ share } />
				<EmptyState.Title>
					{ __( 'No accounts connected yet', 'jetpack-publicize-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Connect a social account to share your posts automatically when you publish.',
						'jetpack-publicize-pkg'
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button variant="solid" onClick={ openConnectionsModal }>
						{ __( 'Add account', 'jetpack-publicize-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		</div>
	);
};

/**
 * Overview tab — sits inside the modernized Social chassis (`SocialPage`
 * → `Tabs.Panel value="overview"`). Renders the connection-error notice
 * + JITM mount-point above a single `Card.Root` that wraps the existing
 * `ConnectionManagement` list. The "Connect an account" CTA is lifted
 * out of `ConnectionManagement` and rendered as a page-header action by
 * the route's `Stage`, so the card itself stays purely informational.
 * When the site has zero connections, the card body becomes an
 * `EmptyState` that points back at the same action.
 *
 * @return The Overview tab body.
 */
export default function OverviewTab(): JSX.Element {
	const { hasConnectionError } = useConnectionErrorNotice();

	const hasConnections = useSelect(
		select => ( select( socialStore ).getConnections() ?? [] ).length > 0,
		[]
	);

	// Social traffic is read from the WPCOM stats endpoint, which requires
	// `view_stats` — a capability non-admins lack, so the fetch 403s and the
	// card falls into its error state. Admins are the only role we expose
	// client-side, so gate the whole chart on `manage_options`: non-admins
	// only get the connection-management UI below.
	const canManageOptions = currentUserCan( 'manage_options' );

	return (
		<div className="jetpack-social-overview">
			{ hasConnectionError && (
				<div className="jetpack-social-overview__notice">
					<ConnectionError />
				</div>
			) }
			<div id="jp-admin-notices" className="jetpack-social-jitm-card" />
			{ /*
			 * Mount the connections modal at the tab level when the
			 * empty state replaces the connections list, so the
			 * "Add account" header + empty-state buttons stay
			 * functional. When `ConnectionManagement` renders, it
			 * already brings its own `ManageConnectionsModal`.
			 */ }
			{ ! hasConnections && <ThemedConnectionsModal /> }
			{ /*
			 * Traffic chart only renders for admins with at least one
			 * connection. The no-connections state focuses the user on
			 * the onboarding CTA in the accounts card; non-admins never
			 * see the chart at all (they can't read stats). Once an admin
			 * connects a single account, the chart appears above with the
			 * paid/free/empty branches taking over from there.
			 */ }
			{ hasConnections && canManageOptions && <TrafficChartCard /> }
			<Card.Root>
				{ hasConnections && (
					<Card.Header className="jetpack-social-overview__accounts-card-header">
						<Card.Title>{ __( 'Connected accounts', 'jetpack-publicize-pkg' ) }</Card.Title>
					</Card.Header>
				) }
				<Card.Content
					className={
						hasConnections ? 'jetpack-social-overview__accounts-card-content' : undefined
					}
				>
					{ hasConnections ? (
						<ConnectionManagement
							hideConnectButton
							hideHeading
							className="jetpack-social-overview__connections-wrapper"
						/>
					) : (
						<NoConnectionsEmptyState />
					) }
				</Card.Content>
			</Card.Root>
		</div>
	);
}
