import { __ } from '@wordpress/i18n';
import SubscribersDataViews from './subscribers-data-views';
import SubscribersTotals from './subscribers-totals';

/**
 * Top-level Subscribers dashboard app — header + totals summary + DataViews table.
 *
 * @return The rendered admin page.
 */
export default function App(): JSX.Element {
	return (
		<div className="jetpack-subscribers-dashboard">
			<header className="jetpack-subscribers-dashboard__header">
				<h1 className="jetpack-subscribers-dashboard__title">
					{ __( 'Subscribers', 'jetpack-subscribers-dashboard' ) }
				</h1>
				<p className="jetpack-subscribers-dashboard__subtitle">
					{ __( 'Manage everyone subscribed to your site.', 'jetpack-subscribers-dashboard' ) }
				</p>
				<SubscribersTotals />
			</header>
			<main className="jetpack-subscribers-dashboard__main">
				<SubscribersDataViews />
			</main>
		</div>
	);
}
