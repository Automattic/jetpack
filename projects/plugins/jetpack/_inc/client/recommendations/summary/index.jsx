import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { isEmpty } from 'lodash';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { getSiteTitle } from 'state/initial-state';
import {
	addViewedRecommendation as addViewedRecommendationAction,
	getSidebarCardSlug,
	getStep,
	getSummaryFeatureSlugs,
	getSummaryResourceSlugs,
	getSummaryPrimarySections,
	getUpsell,
	isUpdatingRecommendationsStep,
	updateRecommendationsStep as updateRecommendationsStepAction,
	updateRecommendationsOnboardingData as updateRecommendationsOnboardingDataAction,
	getIsOnboardingActive,
} from 'state/recommendations';
import { getSettings } from 'state/settings';
import { getPluginsData } from 'state/site/plugins';
import { FeatureSummary } from '../feature-summary';
import './style.scss';
import { PrimarySummary } from '../feature-summary/primary';
import { ResourceSummary } from '../feature-summary/resource';
import { MobileApp } from '../sidebar/mobile-app';
import { OneClickRestores } from '../sidebar/one-click-restores';
import { ProductCardUpsellNoPrice } from '../sidebar/product-card-upsell-no-price';
import { Security } from '../sidebar/security';
import SummaryUpsell from './upsell';

const SummaryComponent = props => {
	const {
		isFetchingMainData,
		isFetchingSidebarData,
		isFetchingBottomSectionData,
		sidebarCardsSlug,
		siteTitle,
		summaryFeatureSlugs,
		summaryResourceSlugs,
		summaryPrimarySections,
		updateRecommendationsStep,
		addViewedRecommendation,
		upsell,
		isOnboardingActive,
		newRecommendations = [],
		stateStepSlug,
		updatingStep,
		updateOnboardingData,
	} = props;

	useEffect( () => {
		if ( 'summary' !== stateStepSlug ) {
			updateRecommendationsStep( 'summary' );
		} else if ( 'summary' === stateStepSlug && ! updatingStep ) {
			addViewedRecommendation( 'summary' );
		}
	}, [ stateStepSlug, updatingStep, updateRecommendationsStep, addViewedRecommendation ] );

	useEffect( () => {
		if ( isOnboardingActive ) {
			updateOnboardingData( { active: null } );
		}
	}, [ updateOnboardingData, isOnboardingActive ] );

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
				{ summaryPrimarySections.map( ( { name, slugs } ) => {
					const productSlug = name.toLowerCase().replace( /[\s_-]+/g, '-' );
					const id = `primary-onboarding-${ productSlug }`;

					return (
						<section key={ name } aria-labelledby={ id }>
							<h2 id={ id }>
								{ sprintf(
									/* translators: %s is the jetpack plan name */
									__( 'Part of your %s plan', 'jetpack' ),
									name
								) }
							</h2>
							{ slugs.map( slug => (
								<PrimarySummary key={ slug } slug={ slug } />
							) ) }
						</section>
					);
				} ) }
				{ ( summaryFeatureSlugs.selected.length > 0 || summaryFeatureSlugs.skipped.length > 0 ) && (
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
				) }
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

	let sidebarCards;
	let undersideCards;

	if ( isFetchingSidebarData ) {
		sidebarCards = <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
	} else {
		switch ( sidebarCardsSlug ) {
			case 'loading':
				sidebarCards = (
					<JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />
				);
				break;
			case 'upsell':
				sidebarCards = upsell.hide_upsell ? <ProductCardUpsellNoPrice /> : <SummaryUpsell />;
				undersideCards = <MobileApp slug={ sidebarCardsSlug } underside />;
				break;
			case 'one-click-restores':
				sidebarCards = (
					<>
						<OneClickRestores />
						<MobileApp slug={ sidebarCardsSlug } />
					</>
				);
				break;
			case 'manage-security':
				sidebarCards = (
					<>
						<Security />
						<MobileApp slug={ sidebarCardsSlug } />
					</>
				);
				break;
			case 'download-app':
				sidebarCards = <MobileApp slug={ sidebarCardsSlug } />;
				break;
			default:
				sidebarCards = <MobileApp slug={ 'unknown' } />;
		}
	}

	return (
		<div className="jp-recommendations-summary">
			<div className="jp-recommendations-summary__main">
				<div
					className={ clsx( 'jp-recommendations-summary__content', {
						isLoading: isFetchingMainData,
					} ) }
				>
					{ mainContent }
				</div>
				<div
					className={ clsx( 'jp-recommendations-summary__sidebar', {
						isLoading: isFetchingSidebarData,
					} ) }
				>
					{ sidebarCards }
				</div>
			</div>
			{ undersideCards && (
				<div
					className={ clsx( 'jp-recommendations-summary__underside', {
						isLoading: isFetchingBottomSectionData,
					} ) }
				>
					{ undersideCards }
				</div>
			) }
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
		const isFetchingBottomSectionData = isEmpty( upsell );

		return {
			isFetchingMainData,
			isFetchingSidebarData,
			isFetchingBottomSectionData,
			sidebarCardsSlug: getSidebarCardSlug( state ),
			siteTitle: getSiteTitle( state ),
			summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
			summaryResourceSlugs: getSummaryResourceSlugs( state ),
			summaryPrimarySections: getSummaryPrimarySections( state ),
			stateStepSlug: getStep( state ),
			updatingStep: isUpdatingRecommendationsStep( state ),
			isOnboardingActive: getIsOnboardingActive( state ),
			upsell,
		};
	},
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
		updateOnboardingData: onboardingData =>
			dispatch( updateRecommendationsOnboardingDataAction( onboardingData ) ),
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
	} )
)( SummaryComponent );

export { Summary };
