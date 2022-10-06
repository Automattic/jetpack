import { imagePath } from 'constants/urls';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import AppsBadge from 'components/apps-badge';
import Card from 'components/card';
import analytics from 'lib/analytics';
import detectMobileDevice from 'lib/device-detector';
import PropTypes from 'prop-types';
import React from 'react';

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

	getAppLinkSection = () => {
		const device = detectMobileDevice();

		switch ( device ) {
			case 'ios':
			case 'android':
				return this.getAppCards( device );
			case 'windows':
			case 'unknown':
				return this.getQrCode();
			default:
				return this.getQrCode();
		}
	};

	getAppCards = device => (
		<div className="jp-apps-card__apps-badges">
			{ device === 'android' ? (
				<AppsBadge
					altText={ __( 'Google Play Store download badge.', 'jetpack' ) }
					titleText={ __( 'Download the Jetpack Android mobile app.', 'jetpack' ) }
					storeName="android"
					storeLink="https://play.google.com/store/apps/details?id=com.jetpack.android&utm_source=jpdash&utm_medium=cta&utm_campaign=getappscard"
					onBadgeClick={ this.trackDownloadClick }
				/>
			) : (
				<AppsBadge
					altText={ __( 'Apple App Store download badge.', 'jetpack' ) }
					titleText={ __( 'Download the Jetpack iOS mobile app.', 'jetpack' ) }
					storeName="ios"
					storeLink="https://apps.apple.com/us/app/jetpack-website-builder/id1565481562?pt=299112ct=jpdash&mt=8"
					onBadgeClick={ this.trackDownloadClick }
				/>
			) }
		</div>
	);

	getQrCode = () => (
		<div className="jp-apps-card__apps-qr-code">
			<img src={ imagePath + 'get-apps-qr-code.svg' } alt="" />
			<p className="jp-apps-card__caption">
				{ createInterpolateElement(
					__(
						'Visit <a>jetpack.com/app</a> or scan this code to download the Jetpack mobile app.',
						'jetpack'
					),
					{
						a: <a className="jp-apps-card__link" href="https://jetpack.com/app" />,
					}
				) }
			</p>
		</div>
	);

	render() {
		const classes = classNames( this.props.className, 'jp-apps-card' );

		return (
			<div className={ classes }>
				<Card className="jp-apps-card__content">
					<div className="jp-apps-card__top">
						<img src={ imagePath + 'get-apps-icon.svg' } alt="" />
					</div>

					<div className="jp-apps-card__description">
						<h3 className="jp-apps-card__header">{ __( 'Jetpack in your pocket', 'jetpack' ) }</h3>

						<p className="jp-apps-card__paragraph">
							{ __(
								'Get powerful security and performance tools in your pocket with the Jetpack mobile app.',
								'jetpack'
							) }
						</p>

						{ this.getAppLinkSection() }
					</div>
				</Card>
			</div>
		);
	}
}

AppsCard.propTypes = {
	className: PropTypes.string,
};

export default AppsCard;
