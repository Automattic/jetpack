/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { FeatureSummary } from '../feature-summary';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import { OneClickRestores } from '../sidebar/one-click-restores';
import { Security } from '../sidebar/security';
import { MobileApp } from '../sidebar/mobile-app';
import { ProductCardUpsellNoPrice } from '../sidebar/product-card-upsell-no-price';
import { ProductCardUpsell } from '../product-card-upsell';
import { generateCheckoutLink } from '../utils';
import { getSiteTitle, getSiteRawUrl, getSiteAdminUrl } from 'state/initial-state';
import {
	getSidebarCardSlug,
	getSummaryFeatureSlugs,
	getUpsell,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';
import { getSettings } from 'state/settings';
import { getPluginsData } from 'state/site/plugins';

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
		siteRawUrl,
		siteAdminUrl,
		summaryFeatureSlugs,
		updateRecommendationsStep,
		upsell,
		newRecommendations,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( 'summary' );
	}, [ updateRecommendationsStep ] );

	const upgradeUrl = upsell.product_slug
		? generateCheckoutLink( upsell.product_slug, siteAdminUrl, siteRawUrl )
		: null;

	const isNew = stepSlug => {
		return newRecommendations.includes( stepSlug );
	};

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
								<FeatureSummary key={ slug } featureSlug={ slug } isNew={ isNew( slug ) } />
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
								<FeatureSummary key={ slug } featureSlug={ slug } isNew={ isNew( slug ) } />
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
					<ProductCardUpsellNoPrice upgradeUrl={ upgradeUrl } />
				) : (
					<>
						<ProductCardUpsell { ...upsell } isRecommended upgradeUrl={ upgradeUrl } />
						<div className="jp-recommendations-summary__footer">
							<MoneyBackGuarantee text={ __( '14-day money-back guarantee', 'jetpack' ) } />
							<div className="jp-recommendations-summary__footnote">
								{ __( 'Special introductory pricing, all renewals are at full price.', 'jetpack' ) }
							</div>
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

SummaryComponent.defaultProps = {
	newRecommendations: [],
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
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
			upsell,
		};
	},
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( SummaryComponent );

export { Summary };
