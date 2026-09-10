import CacheDebugLog from '../../pages/cache-debug-log/cache-debug-log';
import AdvancedCriticalCss from '../../pages/critical-css-advanced/critical-css-advanced';
import GettingStarted from '../../pages/getting-started/getting-started';
import PurchaseSuccess from '../../pages/purchase-success/purchase-success';
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
			return <CacheDebugLog />;
		case 'critical-css-advanced':
			return <AdvancedCriticalCss />;
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
