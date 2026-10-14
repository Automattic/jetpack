import { currentUserCan } from '@automattic/jetpack-script-data';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import OverviewBlogPosts from '../../overview-blog-posts';
import ProductCardsSection from '../../product-cards-section';
import SeoOptInCard from '../../seo-opt-in-card';
import { A4AUpsell } from './a4a-upsell';
import styles from './styles.module.scss';

/**
 * The Overview content component. The full-width footer band (Plans +
 * Connection) lives in `OverviewFooter`, rendered by `TabContent` outside the
 * centered inner container so its background spans the full width.
 *
 * @return The rendered component.
 */
export function OverviewContent() {
	const { overviewV1 = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );

	return (
		<div>
			<div className={ styles.products }>
				<ProductCardsSection />
			</div>

			{ overviewV1 && (
				<div className={ styles[ 'blog-posts' ] }>
					<OverviewBlogPosts />
				</div>
			) }

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
