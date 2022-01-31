/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AppsBadge from 'components/apps-badge';
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import { imagePath } from 'constants/urls';
import { updateSettings, appsCardDismissed } from 'state/settings';
import { arePromotionsActive, userCanManageOptions } from 'state/initial-state';

class AppsCard extends React.Component {
	static displayName = 'AppsCard';

	trackDownloadClick = storeName => {
		analytics.tracks.recordJetpackClick( {
			target: 'apps-card',
			button: 'apps-download',
			page: this.props.location.pathname,
			store: storeName,
		} );
	};

	dismissCard = () => {
		this.props.dismissAppCard();
		analytics.tracks.recordJetpackClick( {
			target: 'apps-card',
			button: 'dismiss',
			page: this.props.location.pathname,
		} );
	};

	render() {
		if ( ! this.props.arePromotionsActive || this.props.isAppsCardDismissed ) {
			return null;
		}

		const classes = classNames( this.props.className, 'jp-apps-card' );

		return (
			<div className={ classes }>
				<Card className="jp-apps-card__content">
					{ this.props.userCanManageOptions && (
						<Button
							borderless
							compact
							className="jp-apps-card__dismiss"
							onClick={ this.dismissCard }
						>
							<span className="dashicons dashicons-no" />
						</Button>
					) }
					<div className="jp-apps-card__top">
						<img src={ imagePath + 'get-apps.svg' } alt="" />
					</div>

					<div className="jp-apps-card__description">
						<h3 className="jp-apps-card__header">{ __( 'Jetpack in your pocket', 'jetpack' ) }</h3>

						<p className="jp-apps-card__paragraph">
							{ __(
								'Get powerful security and performance tools in your pocket with the Jetpack mobile app.',
								'jetpack'
							) }
						</p>

						<div className="jp-apps-card__apps-badges">
							<AppsBadge
								altText={ __( 'Google Play Store download badge.', 'jetpack' ) }
								titleText={ __( 'Download the Jetpack Android mobile app.', 'jetpack' ) }
								storeName="android"
								storeLink="https://play.google.com/store/apps/details?id=com.jetpack.android&utm_source=jpdash&utm_medium=cta&utm_campaign=getappscard"
								onBadgeClick={ this.trackDownloadClick }
							/>
							<AppsBadge
								altText={ __( 'Apple App Store download badge.', 'jetpack' ) }
								titleText={ __( 'Download the Jetpack iOS mobile app.', 'jetpack' ) }
								storeName="ios"
								storeLink="https://apps.apple.com/us/app/jetpack-wp-security-speed/id1565481562?pt=299112ct=jpdash&mt=8"
								onBadgeClick={ this.trackDownloadClick }
							/>
						</div>
					</div>
				</Card>
			</div>
		);
	}
}

AppsCard.propTypes = {
	className: PropTypes.string,
};

export default connect(
	state => {
		return {
			isAppsCardDismissed: appsCardDismissed( state ),
			arePromotionsActive: arePromotionsActive( state ),
			userCanManageOptions: userCanManageOptions( state ),
		};
	},
	dispatch => {
		return {
			dismissAppCard: () => {
				return dispatch( updateSettings( { dismiss_dash_app_card: true } ) );
			},
		};
	}
)( withRouter( AppsCard ) );
