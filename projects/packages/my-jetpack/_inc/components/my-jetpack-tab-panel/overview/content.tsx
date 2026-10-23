import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import useSitePurchases from '../../../data/use-site-purchases';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { isHeaderControlsEnabled } from '../../header-controls/slot';
import OverviewBlogPosts from '../../overview-blog-posts';
import ProductCardsSection from '../../product-cards-section';
import OverviewSections from '../../product-cards-section/overview-sections';
import SeoOptInCard from '../../seo-opt-in-card';
import { A4AUpsell } from './a4a-upsell';
import styles from './styles.module.scss';

/**
 * The Overview content component. The full-width footer band (Plans +
 * Connection), when shown, lives in `OverviewFooter`, rendered by `TabContent`.
 *
 * @return The rendered component.
 */
export function OverviewContent() {
	const { overviewV1 = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	// Loads the plans the header's plan summary shows, so they're ready when it opens.
	useSitePurchases( { enabled: isHeaderControlsEnabled() } );
	const displayName = getScriptData()?.user?.current_user?.display_name;

	return (
		<div>
			<div className={ styles.products }>
				{ overviewV1 ? (
					<>
						<div className={ styles.welcome }>
							<Text variant="heading-xl" render={ <h2 /> }>
								{ displayName
									? sprintf(
											/* translators: %s: The current user's display name. */
											__( 'Welcome to Jetpack, %s!', 'jetpack-my-jetpack' ),
											displayName
										)
									: __( 'Welcome to Jetpack', 'jetpack-my-jetpack' ) }
							</Text>
						</div>
						<OverviewSections />
						<OverviewBlogPosts />
					</>
				) : (
					<ProductCardsSection />
				) }
			</div>

			{ currentUserCan( 'manage_options' ) ? (
				<>
					<div className={ styles[ 'jetpack-manage-upsell' ] }>
						<SeoOptInCard />
					</div>
					<div className={ styles[ 'jetpack-manage-upsell' ] }>
						<A4AUpsell />
					</div>
				</>
			) : null }
		</div>
	);
}
