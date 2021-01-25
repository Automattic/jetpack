/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect } from 'react';
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
import ExternalLink from 'components/external-link';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import { getUpgradeUrl } from 'state/initial-state';
import {
	getSidebarCardSlug,
	getSiteTypeDisplayName,
	getSummaryFeatureSlugs,
	getUpsell,
	updateRecommendationsStepAction,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const SummaryComponent = props => {
	const {
		isFetchingData,
		sidebarCardSlug,
		siteTypeDisplayName,
		summaryFeatureSlugs,
		updateRecommendationsStep,
		upgradeUrl,
		upsell,
	} = props;

	const onLearnMoreClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_summary_learn_more_click' );
	}, [] );

	useEffect( () => {
		updateRecommendationsStep( 'summary' );
	}, [ updateRecommendationsStep ] );

	let sidebarCard;
	if ( isFetchingData ) {
		sidebarCard = <LoadingCard />;
	} else {
		switch ( sidebarCardSlug ) {
			case 'loading':
				sidebarCard = <LoadingCard />;
				break;
			case 'upsell':
				sidebarCard = upsell.hide_upsell ? (
					<ProductCardUpsellNoPrice upgradeUrl={ upgradeUrl } />
				) : (
					<ProductCardUpsell upsell={ upsell } upgradeUrl={ upgradeUrl } />
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
					<h2>{ __( 'Recommendations enabled', 'jetpack' ) }</h2>
					<div>
						{ summaryFeatureSlugs.selected.length > 0 ? (
							summaryFeatureSlugs.selected.map( slug => <FeatureSummary featureSlug={ slug } /> )
						) : (
							<p>
								<em>
									{ __(
										'You didn’t enable any recommended features. To get the most out of Jetpack, enable some recommendations or explore all Jetpack features.',
										'jetpack'
									) }
								</em>
							</p>
						) }
					</div>
					{ summaryFeatureSlugs.skipped.length > 0 && (
						<>
							<h2>{ __( 'Recommendations skipped', 'jetpack' ) }</h2>
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
						{ createInterpolateElement(
							__(
								'Curious what else Jetpack has to offer? <ExternalLink>View all Jetpack features</ExternalLink>',
								'jetpack'
							),
							{
								ExternalLink: (
									<ExternalLink
										href="https://jetpack.com/features/comparison/"
										target="_blank"
										rel="noopener noreferrer"
										onClick={ onLearnMoreClick }
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
		const upsell = getUpsell( state );
		const isFetchingData = isEmpty( upsell );

		return {
			isFetchingData,
			sidebarCardSlug: getSidebarCardSlug( state ),
			siteTypeDisplayName: getSiteTypeDisplayName( state ),
			summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
			upgradeUrl: getUpgradeUrl( state, 'jetpack-recommendations-backups' ),
			upsell,
		};
	},
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( SummaryComponent );

export { Summary };
