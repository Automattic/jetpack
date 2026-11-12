import { Stack } from '@wordpress/ui';
import ConnectionGate from '../connection-gate';
import EarningsCard from './earnings-card';
import PromoCards from './promo-cards';
import type { TabValue } from '../../data/tabs';
import './style.scss';

/**
 * The Overview tab: what the site has earned, then every way to earn.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The tab.
 */
export default function Overview( { openTab }: { openTab: ( tab: TabValue ) => void } ) {
	return (
		<Stack direction="column" gap="2xl">
			{ /* Only the earnings come from WordPress.com; the cards below work without it. */ }
			<ConnectionGate>
				<EarningsCard />
			</ConnectionGate>
			<PromoCards openTab={ openTab } />
		</Stack>
	);
}
