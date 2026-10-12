import { Spinner, Stack } from '@wordpress/ui';
import { EarningsCard } from './earnings-card.tsx';
import { EarnLaunchpad, useEarnLaunchpad } from './launchpad.tsx';
import { PromoCards } from './promo-cards.tsx';
import './style.scss';

/**
 * The Monetization Options tab: the earn checklist until it is done, then the earnings, and every way to earn.
 *
 * @return The rendered screen.
 */
export function Home() {
	const launchpad = useEarnLaunchpad();

	let lead = <EarningsCard />;
	if ( launchpad.isLoading ) {
		lead = <Spinner />;
	} else if ( launchpad.shouldShow ) {
		lead = <EarnLaunchpad launchpad={ launchpad } />;
	}

	return (
		<Stack direction="column" gap="2xl">
			{ lead }
			<PromoCards />
		</Stack>
	);
}
