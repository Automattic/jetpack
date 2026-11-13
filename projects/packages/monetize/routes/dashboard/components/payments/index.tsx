import { Stack } from '@wordpress/ui';
import PlansCard from './plans-card';
import ReturnNotice from './return-notice';
import StripeCard from './stripe-card';
import './style.scss';

/**
 * The Payments tab: the Stripe connection and the site's payment plans.
 *
 * @return The tab.
 */
export default function Payments() {
	return (
		<Stack direction="column" gap="2xl">
			<ReturnNotice />
			<StripeCard />
			<PlansCard />
		</Stack>
	);
}
