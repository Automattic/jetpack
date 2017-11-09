/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import Button from 'components/button';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import { updateSettings, appsCardDismissed } from 'state/settings';
import { arePromotionsActive } from 'state/initial-state';

const AppsCard = React.createClass( {
	displayName: 'AppsCard',

	trackDownloadClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'apps-card',
			button: 'apps-download',
			page: this.props.path
		} );
	},

	dismissCard() {
		this.props.dismissAppCard();
		analytics.tracks.recordJetpackClick( {
			target: 'apps-card',
			button: 'dismiss',
			page: this.props.path
		} );
	},

	render() {
		if ( ! this.props.arePromotionsActive || this.props.isAppsCardDismissed ) {
			return null;
		}

		const classes = classNames(
				this.props.className,
				'jp-apps-card'
		);

		return (
			<div className={ classes }>
				<Card className="jp-apps-card__content">
					<div className="jp-apps-card__top">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240.3 577"><path fill="#C8D6E1" d="M1016.9 546.3V194.8c0-16.9 13.7-30.7 30.7-30.7h162.1c16.9 0 30.7 13.7 30.7 30.7v351.5c0 16.9-13.7 30.7-30.7 30.7h-162.1c-16.9 0-30.7-13.7-30.7-30.7zM956.9-.6H307.1c-23.6 0-42.8 19.2-42.8 42.8v492.3h692.6V-.6zM30.7 575.3H176c16.9 0 30.7-13.7 30.7-30.7V243.3c0-16.9-13.7-30.7-30.7-30.7H30.7c-17 0-30.7 13.8-30.7 30.7v301.3c0 17 13.7 30.7 30.7 30.7z"/><path fill="#FFF" d="M1240.3 508.7h-223.4V231.6h223.4v277.1zM195.8 252.8h-185v268.3h185V252.8zM927.2 500V33.3H299.7V500h627.5z"/><path fill="#85A6BC" d="M993.4 577H219.8c-16.4 0-29.6-13.3-29.6-29.6v-16.1h840v9c0 20.2-16.5 36.7-36.8 36.7z"/><path fill="#658EAB" d="M661.8 554.1H558.5c-12.6 0-22.9-10.2-22.9-22.9h149c.1 12.7-10.1 22.9-22.8 22.9z"/><path fill="#74DCFC" d="M1137.9 356.9c-4.9 20.9-24.6 34.1-46.4 26.9-20.4-6.8-31.8-22.1-29.7-43.5 2.4-24 24.4-35 45.5-30.9 22.1 4.3 35.6 26.6 30.6 47.5zm27.9-33.1c-4.4 1.2-3.1 6.1 1.1 4.9 4.3-1.2 3.3-6.1-1.1-4.9zm23.6 6.5c-4.6.2-3.1 6.1 1.1 4.9 4.3-1.2 1.1-5-1.1-4.9zm-19.6 33.2c2.5-3.6-2.5-7-4.2-2.7-.8 2 1.7 6.3 4.2 2.7zm26.9 3.9c3.9-4.7-3.5-6.7-5.2-2.4-.8 2 2.4 5.8 5.2 2.4zm-49 20.6c-3.1 3.4 2 9.3 4.5 3.7 1.7-4.1-3.1-5.3-4.5-3.7zM70.3 484H38.2v-45.5h32.1V484zm48.4-70.2H86.6V484h32.1v-70.2zm48.5-35.7H135v106h32.1l.1-106z"/><path fill="#00AADC" d="M1061.9 378.7c-.8 1.4-1.5 2.9-1.9 4.4s-.5 3 0 3.9c.3.5.5.8 1 1 .1.1.2.1.3.1.1 0 .2.1.4.1.3 0 .5.1.9.1 1.2.1 2.7-.1 4.1-.6 2.8-.9 5.7-2.3 8.4-4 2.7-1.6 5.4-3.5 7.9-5.4 5.2-3.9 10.1-8.2 14.8-12.7 4.8-4.5 9.3-9.2 13.8-14s8.8-9.7 12.8-14.9c4-5.1 7.8-10.5 10.7-16.1 1.5-2.8 2.7-5.7 3.5-8.6.2-.7.3-1.4.4-2.1.1-.4.1-.7.1-1v-1c0-1.3-.3-2.4-.9-3-.6-.7-1.6-1.1-2.9-1.2-.6-.1-1.4 0-2.1.1s-1.4.2-2.2.5c-3 .8-5.9 2.3-8.7 3.9-.6.3-1.3.1-1.7-.4-.3-.5-.2-1.2.3-1.5 2.6-2.2 5.5-4.1 8.8-5.5 1.7-.7 3.5-1.2 5.5-1.3h.8l.8.1c.3 0 .5.1.8.1l.8.2c.3.1.5.2.8.3l.8.4c.5.3 1 .7 1.5 1.1s.8.9 1.2 1.4c.4.5.5 1 .8 1.5.4 1 .7 2.1.7 3.1.2 2 0 3.9-.4 5.7-.7 3.6-2 6.9-3.5 10-3 6.3-6.8 12-10.8 17.4-4 5.5-8.4 10.6-13 15.6s-9.3 9.7-14.3 14.3c-5 4.5-10.2 8.9-15.8 12.8-2.8 1.9-5.7 3.8-8.8 5.3-1.6.8-3.2 1.5-4.8 2.1-.8.3-1.7.6-2.5.9-.9.2-1.8.5-2.7.6-1.8.3-3.7.5-5.8.1-.5-.1-1-.3-1.5-.5-.3-.1-.5-.3-.8-.4-.2-.2-.5-.3-.7-.5-1-.7-1.6-1.8-1.9-2.9-.5-2.2.1-4.2.9-5.8.8-1.6 1.9-3 3.1-4.3.2-.2.6-.3.9 0 .2 0 .2.3.1.6zm-5.1 61.5c-.1-1.9 1.4-3.5 3.4-3.6 9.7-.6 19.4-1 29-1.2 9.7-.4 19.4-.3 29-.4 9.7-.1 19.4 0 29 .2 9.7.3 19.4.6 29 1.4 1.7.1 3.1 1.4 3.3 3.1.2 1.9-1.3 3.5-3.3 3.7-9.7.8-19.4 1.1-29 1.4-9.7.2-19.4.4-29 .2-9.7-.2-19.4 0-29-.4-9.7-.2-19.4-.6-29-1.2-1.9-.1-3.3-1.4-3.4-3.2zm1.9 36.4c4.8.6 9.7 1 14.5 1.2 4.8.4 9.7.3 14.5.4s9.7 0 14.5-.2c4.8-.3 9.7-.6 14.5-1.4 1.2-.2 2-1.9 1.9-3.7-.1-1.6-.9-2.9-1.9-3-4.8-.8-9.7-1.1-14.5-1.4-4.8-.2-9.7-.4-14.5-.2-4.8.2-9.7 0-14.5.4-4.8.2-9.7.6-14.5 1.2-1.2.2-2 1.8-1.9 3.7 0 1.6.9 2.8 1.9 3zM70.3 484H38.2v-19.5h32.1V484zm48.4-30.1H86.6V484h32.1v-30.1zm48.5-15.4H135V484h32.1l.1-45.5zM33.9 323.6c-.1-1.9 1.4-3.5 3.4-3.6 9.7-.6 19.4-1 29-1.2 9.7-.4 19.4-.3 29-.4 9.7-.1 19.4 0 29 .2 9.7.3 19.4.6 29 1.4 1.7.1 3.1 1.4 3.3 3.1.2 1.9-1.3 3.5-3.3 3.7-9.7.8-19.4 1.1-29 1.4-9.7.2-19.4.4-29 .2-9.7-.2-19.4 0-29-.4-9.7-.2-19.4-.6-29-1.2-1.8-.2-3.3-1.5-3.4-3.2zm1.9 36.3c4.8.6 9.7 1 14.5 1.2 4.8.4 9.7.3 14.5.4s9.7 0 14.5-.2c4.8-.3 9.7-.6 14.5-1.4 1.2-.2 2-1.9 1.9-3.7-.1-1.6-.9-2.9-1.9-3-4.8-.8-9.7-1.1-14.5-1.4-4.8-.2-9.7-.4-14.5-.2-4.8.2-9.7 0-14.5.4-4.8.2-9.7.6-14.5 1.2-1.2.2-2 1.8-1.9 3.7.1 1.6.9 2.9 1.9 3z"/><path fill="#0084C0" d="M1240.3 268h-223.4v-36.5h223.4V268zM195.8 251.9h-185v36.5h185v-36.5zM333.6 82h593.6V33.3H299.7V82"/><path fill="#00AADC" d="M626.9 320.3c.1.3.2.5.4.7-5.3 1.9-11.1 2.9-17.1 2.9-5 0-9.9-.7-14.5-2.1l15.4-44.8 15.8 43.3zm18-50.4c0-6.4-2.3-10.7-4.2-14.2-2.6-4.2-5.1-7.8-5.1-12.1 0-4.7 3.6-9.1 8.6-9.1h.7c-9.1-8.4-21.3-13.5-34.7-13.5-18 0-33.7 9.2-42.9 23.2 1.2 0 2.3.1 3.3.1 5.4 0 13.7-.7 13.7-.7 2.8-.2 3.1 3.9.3 4.2 0 0-2.8.3-5.9.5l18.7 55.7 11.2-33.7-8-21.9c-2.8-.2-5.4-.5-5.4-.5-2.8-.2-2.4-4.4.3-4.2 0 0 8.5.7 13.5.7 5.4 0 13.7-.7 13.7-.7 2.8-.2 3.1 3.9.3 4.2 0 0-2.8.3-5.9.5l18.6 55.2 5.1-17.1c2.7-6.7 4.1-12.2 4.1-16.6zm28.8 2.6c0 35.1-28.4 63.5-63.5 63.5s-63.5-28.4-63.5-63.5 28.4-63.5 63.5-63.5 63.5 28.4 63.5 63.5zm-6.4 0c0-31.5-25.6-57.2-57.2-57.2S553 241 553 272.5s25.6 57.1 57.1 57.1 57.2-25.6 57.2-57.1zm-108.5 0c0 20.3 11.8 37.9 29 46.2l-24.5-67.2c-2.9 6.5-4.5 13.5-4.5 21zm96.5-24.7c.2 1.6.3 3.4.3 5.3 0 5.2-1 11.1-3.9 18.4L636 316.9c15.3-8.9 25.5-25.5 25.5-44.4.1-8.9-2.2-17.3-6.2-24.7z"/></svg>

						<div className="jp-apps-card__clouds">
							<img src={ imagePath + '/white-clouds.svg' } alt="" />
						</div>
					</div>

					<div className="jp-apps-card__description">
						<h3 className="jp-apps-card__header">
							{ __( 'Get WordPress Apps for every device' ) }
						</h3>

						<p className="jp-apps-card__paragraph">
							{ __( 'Manage all your sites from a single dashboard: publish content, track stats, moderate comments, and so much more from anywhere in the world.' ) }
						</p>

						<Button
							className="is-primary"
							onClick={ this.trackDownloadClick }
							href="https://apps.wordpress.com/">
							{ __( 'Download the free apps' ) }
						</Button>
						<br />
						<a
							href="javascript:void(0)"
							onClick={ this.dismissCard }
						>{ __( 'I already use this app.' ) }</a>
					</div>
				</Card>
			</div>
		);
	}
} );

AppsCard.propTypes = {
	className: React.PropTypes.string
};

export default connect(
	state => {
		return {
			isAppsCardDismissed: appsCardDismissed( state ),
			arePromotionsActive: arePromotionsActive( state )
		};
	},
	( dispatch ) => {
		return {
			dismissAppCard: () => {
				return dispatch( updateSettings( { dismiss_dash_app_card: true } ) );
			}
		};
	}
)( AppsCard );
