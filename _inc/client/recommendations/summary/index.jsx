/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { FeatureSummary } from '../feature-summary';
import JetpackLogo from 'components/jetpack-logo';
import {
	getSiteTypeDisplayName,
	getSummaryFeatureSlugs,
	updateRecommendationsStep,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const SummaryComponent = props => {
	const { siteTypeDisplayName, summaryFeatureSlugs } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'summary' );
	} );

	return (
		<div className="jp-recommendations-summary">
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
					{ summaryFeatureSlugs.selected.map( slug => (
						<FeatureSummary featureSlug={ slug } />
					) ) }
				</div>
				<h2>{ __( 'Recommendations skipped' ) }</h2>
				<div>
					{ summaryFeatureSlugs.skipped.map( slug => (
						<FeatureSummary featureSlug={ slug } />
					) ) }
				</div>
			</div>
			<div className="jp-recommendations-summary__cta">CTA</div>
		</div>
	);
};

const Summary = connect(
	state => ( {
		siteTypeDisplayName: getSiteTypeDisplayName( state ),
		summaryFeatureSlugs: getSummaryFeatureSlugs( state ),
	} ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
	} )
)( SummaryComponent );

export { Summary };
