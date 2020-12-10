/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { FeatureSummary } from '../feature-summary';
import { LoadingCard } from '../sidebar/loading-card';
import { OneClickRestores } from '../sidebar/one-click-restores';
import { Security } from '../sidebar/security';
import { MobileApp } from '../sidebar/mobile-app';
import { ProductCardUpsellNoPrice } from '../sidebar/product-card-upsell-no-price';
import { ProductCardUpsell } from '../sidebar/product-card-upsell';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import Gridicon from 'components/gridicon';
import JetpackLogo from 'components/jetpack-logo';
import { getUpgradeUrl } from 'state/initial-state';
import { getProducts } from 'state/products';
import {
	getSidebarCardSlug,
	getSiteTypeDisplayName,
	getSummaryFeatureSlugs,
	updateRecommendationsStep,
} from 'state/recommendations';
import { getSitePlan } from 'state/site';

/**
 * Style dependencies
 */
import './style.scss';

const SummaryComponent = props => {
	const {
		isFetchingProducts,
		isFetchingSiteData,
		productPrice,
		sidebarCardSlug,
		siteTypeDisplayName,
		summaryFeatureSlugs,
		upgradeUrl,
	} = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'summary' );
	} );

	const isFetchingData = isFetchingProducts || isFetchingSiteData;

	let sidebarCard;
	if ( isFetchingData ) {
		sidebarCard = <LoadingCard />;
	} else {
		switch ( sidebarCardSlug ) {
			case 'loading':
				sidebarCard = <LoadingCard />;
				break;
			case 'upsell':
				sidebarCard = (
					<ProductCardUpsell
						title={ __( 'Backup Daily' ) }
						description={ __(
							'Never lose a word, image, page, or time worrying about your site with automated off-site backups and one-click restores.'
						) }
						upgradeUrl={ upgradeUrl }
						features={ [
							__( 'Automated daily off-site backups' ),
							__( 'One-click restores' ),
							__( 'Unlimited secure storage' ),
						] }
						productPrice={ productPrice }
					/>
				);
				break;
			case 'one-click-restores':
				sidebarCard = <OneClickRestores />;
				break;
			case 'manage-security':
				sidebarCard = <Security />;
				break;
			case 'download-app':
				sidebarCard = <MobileApp />;
				break;
			default:
				throw `Unknown sidebarCardSlug in SummaryComponent: ${ sidebarCardSlug }`;
		}
	}

	return (
		<div className="jp-recommendations-summary">
			<div>
				<div className="jp-recommendations-summary__configuration">
					<JetpackLogo hideText />
					<h1>
						{ sprintf(
							/* translators: placeholder indicates the type of site, such as "personal site" or "store" */
							__(
								'Nice work! Let’s ensure the features you enabled are configured for your %s.',
								'jetpack'
							),
							siteTypeDisplayName
						) }
					</h1>
					<h2>{ __( 'Recommendations enabled' ) }</h2>
					<div>
						{ summaryFeatureSlugs.selected.length > 0 ? (
							summaryFeatureSlugs.selected.map( slug => <FeatureSummary featureSlug={ slug } /> )
						) : (
							<p>
								<em>
									{ __(
										'You didn’t enable any recommended features. To get the most out of Jetpack, enable some recommendations or explore all Jetpack features.'
									) }
								</em>
							</p>
						) }
					</div>
					{ summaryFeatureSlugs.skipped.length > 0 && (
						<>
							<h2>{ __( 'Recommendations skipped' ) }</h2>
							<div>
								{ summaryFeatureSlugs.skipped.map( slug => (
									<FeatureSummary featureSlug={ slug } />
								) ) }
							</div>
						</>
					) }
				</div>
				<div className="jp-recommendations-summary__more-features">
					<Gridicon icon="info-outline" size={ 28 } />
					<p>
						{ jetpackCreateInterpolateElement(
							__(
								'Curious what else Jetpack has to offer? <ExternalLink>View all Jetpack features</ExternalLink>'
							),
							{
								ExternalLink: (
									<ExternalLink
										href="https://jetpack.com/features/comparison/"
										target="_blank"
										icon={ true }
										iconSize={ 16 }
									/>
								),
							}
						) }
					</p>
				</div>
			</div>
			<div className="jp-recommendations-summary__sidebar">{ sidebarCard }</div>
		</div>
	);
};

const Summary = connect(
	state => {
		const products = getProducts( state );
		const sitePlan = getSitePlan( state );
		const isFetchingProducts = isEmpty( products );
		const isFetchingSiteData = isEmpty( sitePlan );

		let backupDailyMonthly = {};
		if ( ! isFetchingProducts ) {
			backupDailyMonthly = {
				price: products.jetpack_backup_daily_monthly.cost,
				currencyCode: products.jetpack_backup_daily_monthly.currency_code,
			};
		}

		return {
			isFetchingProducts,
			isFetchingSiteData,
			productPrice: backupDailyMonthly,
			sidebarCardSlug: getSidebarCardSlug( state ),
			siteTypeDisplayName: getSiteTypeDisplayName( state ),
			summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
			upgradeUrl: getUpgradeUrl( state, 'jetpack-recommendations-backups' ),
		};
	},
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
	} )
)( SummaryComponent );

export { Summary };
