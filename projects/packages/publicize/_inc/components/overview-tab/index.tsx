import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import ConnectionManagement from '../connection-management';
import './style.scss';

/**
 * Overview tab — sits inside the modernized Social chassis (`SocialPage`
 * → `Tabs.Panel value="overview"`). Renders the connection-error notice
 * + JITM mount-point above a single `Card.Root` that wraps the existing
 * `ConnectionManagement` list. The "Connect an account" CTA is lifted
 * out of `ConnectionManagement` and rendered as a page-header action by
 * the route's `Stage`, so the card itself stays purely informational.
 *
 * @return The Overview tab body.
 */
export default function OverviewTab(): JSX.Element {
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<div className="jetpack-social-overview">
			{ hasConnectionError && (
				<div className="jetpack-social-overview__notice">
					<ConnectionError />
				</div>
			) }
			<div id="jp-admin-notices" className="jetpack-social-jitm-card" />
			<Card.Root>
				<Card.Header>
					<Card.Title>{ __( 'Connected accounts', 'jetpack-publicize-pkg' ) }</Card.Title>
				</Card.Header>
				<Card.Content>
					<ConnectionManagement hideConnectButton hideHeading />
				</Card.Content>
			</Card.Root>
		</div>
	);
}
