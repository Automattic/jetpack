import { __, _n, sprintf } from '@wordpress/i18n';
import Meta from './meta/meta';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import Upgraded from '$features/ui/upgraded/upgraded';
import styles from './cornerstone-pages.module.scss';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCornerstonePages } from './lib/stores/cornerstone-pages';

const CornerstoneTitleSummary = () => {
	const [ cornerstonePages ] = useCornerstonePages();
	if ( ! cornerstonePages.length ) {
		return null;
	}
	return (
		<>
			{ sprintf(
				/* translators: %s is the number of pages added to the cornerstone pages list. */
				__( 'Added: %s', 'jetpack-boost' ),
				() => {
					const homepage = Jetpack_Boost.site.url.replace( /\/$/, '' );
					const hasHomepage = cornerstonePages.includes( homepage );

					if ( hasHomepage ) {
						if ( cornerstonePages.length > 1 ) {
							return sprintf(
								/* translators: %d is the number of pages added to the cornerstone pages list. */
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
			) }
		</>
	);
};
const CornerstonePages = () => {
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );

	return (
		<div className={ styles[ 'cornerstone-pages' ] }>
			<Panel className={ styles[ 'components-panel' ] }>
				<PanelBody
					title={
						<div>
							<div>
								<h3>
									{ __( 'Cornerstone Pages', 'jetpack-boost' ) }
									{ isPremium && <Upgraded /> }
								</h3>
							</div>
							<div>
								<CornerstoneTitleSummary />
							</div>
						</div>
					}
					initialOpen={ false }
					onToggle={ ( value: boolean ) => {
						recordBoostEvent( 'cornerstone_pages_panel_toggle', {
							status: value ? 'open' : 'close',
						} );
					} }
					className={ styles[ 'cornerstone-pages-body' ] }
				>
					<PanelRow>
						<Meta />
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
};

export default CornerstonePages;
