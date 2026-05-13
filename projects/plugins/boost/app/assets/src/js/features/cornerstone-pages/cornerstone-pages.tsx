import { __, _n, sprintf } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';
import LcpModule from '$features/lcp/lcp';
import { useSingleModuleState } from '$features/module/lib/stores';
import Upgraded from '$features/ui/upgraded/upgraded';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCustomCornerstonePages } from './lib/stores/cornerstone-pages';
import Meta, { CornerstonePagesUpgradeCTA } from './meta/meta';
import Prerender from './prerender/prerender';

const CornerstonePages = () => {
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );

	const [ moduleState ] = useSingleModuleState( 'speculation_rules' );
	const isSpeculationRulesAvailable = moduleState?.available ?? false;

	const handleToggle = ( open: boolean ) => {
		recordBoostEvent( 'cornerstone_pages_panel_toggle', {
			status: open ? 'open' : 'close',
		} );
	};

	return (
		<CollapsibleCard.Root onOpenChange={ handleToggle }>
			<CollapsibleCard.Header>
				<Stack direction="column" gap="xs">
					<Card.Title>
						{ __( 'Cornerstone Pages', 'jetpack-boost' ) }
						{ isPremium && <Upgraded /> }
					</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<CornerstoneTitleSummary />
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Meta />
				{ isSpeculationRulesAvailable && <Prerender /> }
				<CornerstonePagesUpgradeCTA />
				<LcpModule inline />
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

const CornerstoneTitleSummary = () => {
	const [ cornerstonePages ] = useCustomCornerstonePages();
	if ( ! Array.isArray( cornerstonePages ) ) {
		return null;
	}

	const pages =
		cornerstonePages.length === 0
			? __( 'Homepage', 'jetpack-boost' )
			: sprintf(
					/* translators: %d is the number of pages in the custom cornerstone pages list. */
					_n(
						'Homepage + %d page',
						'Homepage + %d pages',
						cornerstonePages.length,
						'jetpack-boost'
					),
					cornerstonePages.length
			  );

	return sprintf(
		/* translators: %s is the number of pages in the custom cornerstone pages list. */
		__( 'Added: %s', 'jetpack-boost' ),
		pages
	);
};

export default CornerstonePages;
