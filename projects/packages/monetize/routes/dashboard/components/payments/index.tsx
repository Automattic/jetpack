import { Stack } from '@wordpress/ui';
import CouponsCard from './coupons-card';
import PlansCard from './plans-card';
import ReturnNotice from './return-notice';
import StripeCard from './stripe-card';
import './style.scss';

/**
 * The Payments tab: the Stripe connection, the site's payment plans and its coupons.
 *
 * @return The tab.
 */
export default function Payments() {
	return (
		<Stack direction="column" gap="2xl">
			<ReturnNotice />
			<StripeCard />
			<PlansCard />
			<CouponsCard />
		</Stack>
	);
}
