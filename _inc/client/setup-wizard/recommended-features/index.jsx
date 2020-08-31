/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FeatureToggleGroup } from '../feature-toggle-group';
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import { fetchSettings, isFetchingSettingsList } from 'state/settings';
import { getRecommendedFeatureGroups, updateSetupWizardStatus } from 'state/setup-wizard';

import './style.scss';

class RecommendedFeatures extends Component {
	componentDidMount = () => {
		if ( ! this.props.isFetchingSettingsList ) {
			this.props.fetchSettings();
		}
		this.props.updateStatus( 'features-page' );
		analytics.tracks.recordEvent( 'jetpack_wizard_page_view', { step: 'features-page' } );
	};

	onDoneButtonClick = () => {
		this.props.updateStatus( 'completed' );
		analytics.tracks.recordEvent( 'jetpack_wizard_features_done' );
		window.setTimeout( () => {
			window.location.reload();
		}, 200 );
	};

	onExploreMoreButtonClick = () => {
		analytics.tracks.recordEvent( 'jetpack_wizard_features_explore_more' );
	};

	render() {
		return (
			<div className="jp-setup-wizard-main jp-setup-wizard-recommended-features-main">
				<img
					src={ imagePath + 'jetpack-new-heights.svg' }
					alt={ __( 'A rocketship using Jetpack to reach new heights', 'jetpack' ) }
				/>
				<h1>{ __( 'Get started with Jetpack’s powerful features', 'jetpack' ) }</h1>
				<p className="jp-setup-wizard-recommended-features-p1">
					{ __(
						'Jetpack has a lot of features so we’ve made a few recommendations for you below.',
						'jetpack'
					) }
				</p>
				<p className="jp-setup-wizard-recommended-features-p2">
					{ __( 'You can change your feature settings at any time.', 'jetpack' ) }
				</p>
				<div className="jp-setup-wizard-feature-groups-container">
					{ this.props.recommendedFeatureGroups.map( featureGroup => {
						return (
							<FeatureToggleGroup
								title={ featureGroup.title }
								details={ featureGroup.details }
								features={ featureGroup.features }
							/>
						);
					} ) }
				</div>
				<div className="jp-setup-wizard-recommended-features-buttons-container">
					<Button primary href="#/dashboard" onClick={ this.onDoneButtonClick }>
						{ __( 'I’m done for now', 'jetpack' ) }
					</Button>
					<Button href="#/settings" onClick={ this.onExploreMoreButtonClick }>
						{ __( 'Explore more features', 'jetpack' ) }
					</Button>
				</div>
			</div>
		);
	}
}

RecommendedFeatures = connect(
	state => ( {
		isFetchingSettingsList: isFetchingSettingsList( state ),
		recommendedFeatureGroups: getRecommendedFeatureGroups( state ),
	} ),
	dispatch => ( {
		fetchSettings: () => dispatch( fetchSettings() ),
		updateStatus: status => dispatch( updateSetupWizardStatus( status ) ),
	} )
)( RecommendedFeatures );

export { RecommendedFeatures };
