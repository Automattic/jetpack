/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import { imagePath } from 'constants/urls';
import { updateSettings, appsCardDismissed } from 'state/settings';
import { arePromotionsActive, userCanManageOptions } from 'state/initial-state';

class AppsCard extends React.Component {
	static displayName = 'AppsCard';

	trackDownloadClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'apps-card',
			button: 'apps-download',
			page: this.props.path,
		} );
	};

	dismissCard = () => {
		this.props.dismissAppCard();
		analytics.tracks.recordJetpackClick( {
			target: 'apps-card',
			button: 'dismiss',
			page: this.props.path,
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
							href="javascript:void(0)"
							onClick={ this.dismissCard }
						>
							<span className="dashicons dashicons-no" />
						</Button>
					) }
					<div className="jp-apps-card__top">
						<img src={ imagePath + 'get-apps.svg' } alt="" />
					</div>

					<div className="jp-apps-card__description">
						<h3 className="jp-apps-card__header">
							{ __( 'Get WordPress Apps for every device', 'jetpack' ) }
						</h3>

						<p className="jp-apps-card__paragraph">
							{ __(
								'Manage all your sites from a single dashboard: publish content, track stats, moderate comments, and so much more from anywhere in the world.',
								'jetpack'
							) }
						</p>

						<Button
							className="is-primary"
							onClick={ this.trackDownloadClick }
							href="https://apps.wordpress.com/get?utm_source=jpdash&utm_medium=cta&utm_campaign=getappscard"
						>
							{ __( 'Download the free apps', 'jetpack' ) }
						</Button>
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
)( AppsCard );
