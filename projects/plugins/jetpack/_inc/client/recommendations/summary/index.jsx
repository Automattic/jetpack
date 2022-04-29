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
import SummaryUpsell from './upsell';
import { FeatureSummary } from '../feature-summary';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { OneClickRestores } from '../sidebar/one-click-restores';
import { Security } from '../sidebar/security';
import { MobileApp } from '../sidebar/mobile-app';
import { ProductCardUpsellNoPrice } from '../sidebar/product-card-upsell-no-price';
import { getSiteTitle } from 'state/initial-state';
import {
	addViewedRecommendation as addViewedRecommendationAction,
	getSidebarCardSlug,
	getStep,
	getSummaryFeatureSlugs,
	getSummaryResourceSlugs,
	getUpsell,
	isUpdatingRecommendationsStep,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';
import { getSettings } from 'state/settings';
import { getPluginsData } from 'state/site/plugins';

/**
 * Style dependencies
 */
import './style.scss';
import { ResourceSummary } from '../feature-summary/resource';

const SummaryComponent = props => {
	const {
		isFetchingMainData,
		isFetchingSidebarData,
		sidebarCardSlug,
		siteTitle,
		summaryFeatureSlugs,
		summaryResourceSlugs,
		updateRecommendationsStep,
		addViewedRecommendation,
		upsell,
		newRecommendations,
		stateStepSlug,
		updatingStep,
	} = props;

	useEffect( () => {
		if ( 'summary' !== stateStepSlug ) {
			updateRecommendationsStep( 'summary' );
		} else if ( 'summary' === stateStepSlug && ! updatingStep ) {
			addViewedRecommendation( 'summary' );
		}
	}, [ stateStepSlug, updatingStep, updateRecommendationsStep, addViewedRecommendation ] );

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
				{ summaryResourceSlugs.length > 0 && (
					<section aria-labelledby="resources-summary-title">
						<h2 id="resources-summary-title">{ __( 'Resources', 'jetpack' ) }</h2>
						<div>
							{ summaryResourceSlugs.map( slug => (
								<ResourceSummary key={ slug } resourceSlug={ slug } isNew={ isNew( slug ) } />
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
				sidebarCard = upsell.hide_upsell ? <ProductCardUpsellNoPrice /> : <SummaryUpsell />;
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
			summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
			summaryResourceSlugs: getSummaryResourceSlugs( state ),
			stateStepSlug: getStep( state ),
			updatingStep: isUpdatingRecommendationsStep( state ),
			upsell,
		};
	},
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
	} )
)( SummaryComponent );

export { Summary };
