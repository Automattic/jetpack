import { __, _n, sprintf } from '@wordpress/i18n';
import Meta, { CornerstonePagesUpgradeCTA } from './meta/meta';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import Upgraded from '$features/ui/upgraded/upgraded';
import styles from './cornerstone-pages.module.scss';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCustomCornerstonePages } from './lib/stores/cornerstone-pages';
import Prerender from './prerender/prerender';
import { useSingleModuleState } from '$features/module/lib/stores';

const CornerstonePages = () => {
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );

	const [ moduleState ] = useSingleModuleState( 'speculation_rules' );
	const isSpeculationRulesAvailable = moduleState?.available ?? false;

	return (
		<div className={ styles.wrapper }>
			<Panel className={ styles.panel }>
				<PanelBody
					title={
						<div>
							<h3>
								{ __( 'Cornerstone Pages', 'jetpack-boost' ) }
								{ isPremium && <Upgraded /> }
							</h3>
							<CornerstoneTitleSummary />
						</div>
					}
					initialOpen={ false }
					onToggle={ ( value: boolean ) => {
						recordBoostEvent( 'cornerstone_pages_panel_toggle', {
							status: value ? 'open' : 'close',
						} );
					} }
					className={ styles.body }
				>
					<PanelRow>
						<Meta />
					</PanelRow>
					{ isSpeculationRulesAvailable && (
						<PanelRow>
							<Prerender />
						</PanelRow>
					) }
					<CornerstonePagesUpgradeCTA />
				</PanelBody>
			</Panel>
		</div>
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
