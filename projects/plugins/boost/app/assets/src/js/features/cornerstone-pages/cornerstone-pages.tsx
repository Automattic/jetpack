import { __, _n, sprintf } from '@wordpress/i18n';
import Meta, { CornerstonePagesUpgradeCTA } from './meta/meta';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import Upgraded from '$features/ui/upgraded/upgraded';
import styles from './cornerstone-pages.module.scss';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCornerstonePages } from './lib/stores/cornerstone-pages';
import Pill from '$features/ui/pill/pill';
import Prerender from './prerender/prerender';
import { z } from 'zod';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';

const CornerstonePages = () => {
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );

	const [ isSpeculationRulesApiSupported ] = useDataSync(
		'jetpack_boost_ds',
		'speculation_rules_api_support',
		z.boolean().catch( false )
	);

	return (
		<div className={ styles.wrapper }>
			<Panel className={ styles.panel }>
				<PanelBody
					title={
						<div>
							<h3>
								{ __( 'Cornerstone Pages', 'jetpack-boost' ) }
								<Pill text={ __( 'Experimental', 'jetpack-boost' ) } />
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
					{ isSpeculationRulesApiSupported.data && (
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
	const [ cornerstonePages ] = useCornerstonePages();
	if ( ! cornerstonePages.length ) {
		return null;
	}
	return sprintf(
		/* translators: %s is the number of pages in the cornerstone pages list apart from the homepage. */
		__( 'Added: %s', 'jetpack-boost' ),
		() => {
			const homepage = Jetpack_Boost.site.url.replace( /\/$/, '' );
			const hasHomepage = cornerstonePages.includes( homepage );

			if ( hasHomepage ) {
				if ( cornerstonePages.length > 1 ) {
					return sprintf(
						/* translators: %d is the number of pages in the cornerstone pages list apart from the homepage. */
						_n(
							'Homepage + %d page',
							'Homepage + %d pages',
							cornerstonePages.length - 1,
							'jetpack-boost'
						),
						cornerstonePages.length - 1
					);
				}
				return __( 'Homepage', 'jetpack-boost' );
			}
			return sprintf(
				/* translators: %d is the number of pages added to the cornerstone pages list. */
				_n( '%d page', '%d pages', cornerstonePages.length, 'jetpack-boost' ),
				cornerstonePages.length
			);
		}
	);
};

export default CornerstonePages;
