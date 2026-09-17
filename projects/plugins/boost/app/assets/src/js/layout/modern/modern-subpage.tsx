import { __ } from '@wordpress/i18n';
import CacheDebugLogCard from '../../pages/cache-debug-log/cache-debug-log-card';
import CriticalCssAdvancedCards from '../../pages/critical-css-advanced/critical-css-advanced-cards';
import GettingStarted from '../../pages/getting-started/getting-started';
import PurchaseSuccess from '../../pages/purchase-success/purchase-success';
import SubpageFrame from './subpage-frame';
import type { Subpage } from '../../../../../../_inc/runtime-contract';

type ModernSubpageProps = {
	subpage: Subpage;
};

/**
 * @param props         - Component props.
 * @param props.subpage - Sub-page to render.
 */
const ModernSubpage = ( { subpage }: ModernSubpageProps ) => {
	switch ( subpage ) {
		case 'cache-debug-log':
			return (
				<SubpageFrame title={ __( 'Cache debug log', 'jetpack-boost' ) }>
					<CacheDebugLogCard />
				</SubpageFrame>
			);
		case 'critical-css-advanced':
			return (
				<SubpageFrame title={ __( 'Critical CSS recommendations', 'jetpack-boost' ) }>
					<CriticalCssAdvancedCards />
				</SubpageFrame>
			);
		case 'getting-started':
			return <GettingStarted />;
		case 'purchase-successful':
			return <PurchaseSuccess />;
	}

	// A sub-page added to the contract without a case here would render nothing.
	subpage satisfies never;

	return null;
};

export default ModernSubpage;
