import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import clsx from 'clsx';
import useSitePurchases from '../../../data/use-site-purchases';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { isHeaderControlsEnabled } from '../../header-controls/slot';
import OverviewBlogPosts from '../../overview-blog-posts';
import ProductCardsSection from '../../product-cards-section';
import OverviewSections from '../../product-cards-section/overview-sections';
import SeoOptInCard from '../../seo-opt-in-card';
import { A4AUpsell } from './a4a-upsell';
import { TypedText, useOverviewLoadAnimation } from './load-animation';
import loadAnimationStyles from './load-animation/style.module.scss';
import styles from './styles.module.scss';
import type { ReactNode } from 'react';

/**
 * The Overview content component. The full-width footer band (Plans +
 * Connection), when shown, lives in `OverviewFooter`, rendered by `TabContent`.
 *
 * @param {object}    props               - Component props.
 * @param {ReactNode} props.beforeContent - Notices, shown below the Welcome heading.
 * @return The rendered component.
 */
export function OverviewContent( { beforeContent }: { beforeContent?: ReactNode } ) {
	const { overviewV1 = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	// Loads the plans the header's plan summary shows, so they're ready when it opens.
	useSitePurchases( { enabled: isHeaderControlsEnabled() } );
	// WordPress stores display names HTML-escaped.
	const name =
		getMyJetpackWindowInitialState()?.userFirstName ||
		decodeEntities( getScriptData()?.user?.current_user?.display_name ?? '' );
	const { animate, onPlayed } = useOverviewLoadAnimation();
	const welcome = name
		? sprintf(
				/* translators: %s: The current user's first name, or their display name. */
				__( 'Welcome to Jetpack, %s!', 'jetpack-my-jetpack' ),
				name
			)
		: __( 'Welcome to Jetpack', 'jetpack-my-jetpack' );

	return (
		<div>
			<div className={ styles.products }>
				{ overviewV1 ? (
					<>
						<div className={ styles.welcome }>
							<Text variant="heading-xl" render={ <h2 /> }>
								{ animate ? <TypedText text={ welcome } onTyped={ onPlayed } /> : welcome }
							</Text>
						</div>
						{ beforeContent }
						<OverviewSections className={ clsx( { [ loadAnimationStyles.sections ]: animate } ) } />
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
