/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { useEffect, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { FeatureSummary } from '../feature-summary';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import analytics from 'lib/analytics';
import { OneClickRestores } from '../sidebar/one-click-restores';
import { Security } from '../sidebar/security';
import { MobileApp } from '../sidebar/mobile-app';
import { ProductCardUpsellNoPrice } from '../sidebar/product-card-upsell-no-price';
import { ProductCardUpsell } from '../product-card-upsell';
import Timer from '../timer';
import { getSiteTitle } from 'state/initial-state';
import {
	getSidebarCardSlug,
	getSummaryFeatureSlugs,
	getUpsell,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';
import { getSettings } from 'state/settings';
import { getPluginsData } from 'state/site/plugins';
import { getSiteDiscount } from 'state/site/reducer';

/**
 * Style dependencies
 */
import './style.scss';

const SummaryComponent = props => {
	const {
		isFetchingMainData,
		isFetchingSidebarData,
		sidebarCardSlug,
		siteTitle,
		summaryFeatureSlugs,
		updateRecommendationsStep,
		upsell,
		discountData,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( 'summary' );
	}, [ updateRecommendationsStep ] );

	const { product_slug: productSlug } = upsell || {};
	const { discount, is_used: isUsed, expiry_date: expiryDate } = discountData;
	const hasDiscount = useMemo(
		() => discount && ! isUsed && new Date( expiryDate ).valueOf() - Date.now() > 0,
		[ discount, isUsed, expiryDate ]
	);

	const onUpsellClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'upsell_with_price',
			product_slug: productSlug,
		} );
	}, [ productSlug ] );
	const onUpsellMount = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'upsell_with_price',
			product_slug: productSlug,
		} );
	}, [ productSlug ] );

	const mainContent = isFetchingMainData ? (
		<JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />
	) : (
		<>
			<div className="jp-recommendations-summary__configuration">
				<h1>
					{ sprintf(
						/* translators: %s is the site name */
						__( 'Nice work! Let’s recap what we enabled for %s.', 'jetpack' ),
						siteTitle
					) }
				</h1>
				<section aria-labelledby="enabled-recommendations">
					<h2 id="enabled-recommendations">{ __( 'Recommendations enabled', 'jetpack' ) }</h2>
					<div>
						{ summaryFeatureSlugs.selected.length > 0 ? (
							summaryFeatureSlugs.selected.map( slug => (
								<FeatureSummary key={ slug } featureSlug={ slug } />
							) )
						) : (
							<p className="jp-recommendations-summary__recommendation-notice">
								<em>
									{ __(
										'You didn’t enable any recommended features. To get the most out of Jetpack, enable some recommendations or explore all Jetpack features.',
										'jetpack'
									) }
								</em>
							</p>
						) }
					</div>
				</section>
				{ summaryFeatureSlugs.skipped.length > 0 && (
					<section aria-labelledby="skipped-recommendations">
						<h2 id="skipped-recommendations">{ __( 'Recommendations skipped', 'jetpack' ) }</h2>
						<div>
							{ summaryFeatureSlugs.skipped.map( slug => (
								<FeatureSummary key={ slug } featureSlug={ slug } />
							) ) }
						</div>
					</section>
				) }
			</div>
		</>
	);

	let sidebarCard;

	if ( isFetchingSidebarData ) {
		sidebarCard = <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
	} else {
		switch ( sidebarCardSlug ) {
			case 'loading':
				sidebarCard = <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
				break;
			case 'upsell':
				sidebarCard = upsell.hide_upsell ? (
					<ProductCardUpsellNoPrice />
				) : (
					<>
						<ProductCardUpsell
							{ ...upsell }
							slug={ productSlug }
							isRecommended
							onClick={ onUpsellClick }
							onMount={ onUpsellMount }
						/>
						{ hasDiscount && (
							<div className="jp-recommendations-summary__discount">
								<div className="jp-recommendations-summary__timer">
									<Timer
										timeClassName="jp-recommendations-summary__time"
										label={ __( 'Discount ends in:', 'jetpack' ) }
										expiryDate={ expiryDate }
									/>
								</div>
								<a
									className="jp-recommendations-summary__reco-link"
									href="#/recommendations/product-suggestions"
								>
									{ __( 'See all discounted products', 'jetpack' ) }
								</a>
							</div>
						) }
						<div className="jp-recommendations-summary__footer">
							<MoneyBackGuarantee text={ __( '14-day money-back guarantee', 'jetpack' ) } />
							{ hasDiscount && (
								<div className="jp-recommendations-summary__footnote">
									{ __(
										'* Discount is for first term only, all renewals are at full price.',
										'jetpack'
									) }
								</div>
							) }
						</div>
					</>
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
			<div
				className={ classNames( 'jp-recommendations-summary__content', {
					isLoading: isFetchingMainData,
				} ) }
			>
				{ mainContent }
			</div>
			<div
				className={ classNames( 'jp-recommendations-summary__sidebar', {
					isLoading: isFetchingSidebarData,
				} ) }
			>
				{ sidebarCard }
			</div>
		</div>
	);
};

const Summary = connect(
	state => {
		const pluginsData = getPluginsData( state );
		const settings = getSettings( state );
		const upsell = getUpsell( state );
		const isFetchingMainData = isEmpty( settings ) || isEmpty( pluginsData );
		const isFetchingSidebarData = isEmpty( upsell );

		return {
			isFetchingMainData,
			isFetchingSidebarData,
			sidebarCardSlug: getSidebarCardSlug( state ),
			siteTitle: getSiteTitle( state ),
			summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
			upsell,
			discountData: getSiteDiscount( state ),
		};
	},
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( SummaryComponent );

export { Summary };
