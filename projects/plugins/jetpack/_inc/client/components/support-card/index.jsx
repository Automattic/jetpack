/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import Button from 'components/button';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import {
	getSiteConnectionStatus,
	hasConnectedOwner,
	isCurrentUserLinked,
	isConnectionOwner,
	connectUser,
} from 'state/connection';
import { isAtomicSite, isDevVersion as _isDevVersion, getUpgradeUrl } from 'state/initial-state';
import JetpackBanner from 'components/jetpack-banner';
import { JETPACK_CONTACT_SUPPORT, JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import {
	getJetpackProductUpsellByFeature,
	FEATURE_PRIORITY_SUPPORT_JETPACK,
} from 'lib/plans/constants';

class SupportCard extends React.Component {
	static displayName = 'SupportCard';

	static defaultProps = {
		className: '',
		siteConnectionStatus: false,
	};

	trackBannerClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'banner-click',
			feature: 'support',
			page: this.props.path,
			is_user_wpcom_connected: this.props.isCurrentUserLinked ? 'yes' : 'no',
			is_connection_owner: this.props.isConnectionOwner ? 'yes' : 'no',
		} );
	};

	/**
	 * Track the click and show the user connection screen.
	 */
	handleConnectClick = () => {
		this.trackBannerClick();
		this.props.connectUser();
	};

	shouldComponentUpdate( nextProps ) {
		return nextProps.sitePlan.product_slug !== this.props.sitePlan.product_slug;
	}

	trackAskQuestionClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'support-card',
			button: 'support-ask',
			page: this.props.path,
		} );
	};

	trackSearchClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'support-card',
			button: 'support-search',
			page: this.props.path,
		} );
	};

	render() {
		if (
			'undefined' === typeof this.props.sitePlan.product_slug &&
			this.props.isFetchingSiteData
		) {
			return <div />;
		}

		const classes = classNames( this.props.className, 'jp-support-card' ),
			noPrioritySupport =
				'undefined' === typeof this.props.sitePlan.product_slug ||
				'jetpack_free' === this.props.sitePlan.product_slug;

		const jetpackSupportURl = this.props.isDevVersion
			? JETPACK_CONTACT_BETA_SUPPORT
			: JETPACK_CONTACT_SUPPORT;

		return (
			<div className={ classes }>
				<Card className="jp-support-card__happiness">
					<div className="jp-support-card__happiness-contact">
						<h3 className="jp-support-card__header">{ __( "We're here to help", 'jetpack' ) }</h3>
						<p className="jp-support-card__description">
							{ noPrioritySupport
								? __(
										'Jetpack offers support via community forums for any site without a paid product.',
										'jetpack'
								  )
								: __(
										'Your paid plan gives you access to prioritized Jetpack support.',
										'jetpack'
								  ) }
						</p>
						<p className="jp-support-card__description">
							<Button
								onClick={ this.trackAskQuestionClick }
								href={
									this.props.isAtomicSite
										? getRedirectUrl( 'calypso-help-contact' )
										: jetpackSupportURl
								}
							>
								{ __( 'Ask a question', 'jetpack' ) }
							</Button>
							<Button
								onClick={ this.trackSearchClick }
								href={
									this.props.isAtomicSite
										? getRedirectUrl( 'calypso-help' )
										: getRedirectUrl( 'jetpack-support' )
								}
							>
								{ __( 'Search our support site', 'jetpack' ) }
							</Button>
						</p>
					</div>
				</Card>
				{ this.props.siteConnectionStatus && noPrioritySupport && this.props.hasConnectedOwner && (
					<JetpackBanner
						title={ __( 'Get a faster resolution to your support questions.', 'jetpack' ) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_PRIORITY_SUPPORT_JETPACK ) }
						callToAction={ __( 'Upgrade', 'jetpack' ) }
						onClick={ this.trackBannerClick }
						href={ this.props.supportUpgradeUrl }
					/>
				) }
				{ this.props.siteConnectionStatus &&
					noPrioritySupport &&
					! this.props.hasConnectedOwner && (
						<JetpackBanner
							title={ __(
								'Connect your WordPress.com account and upgrade to get a faster resolution to your support questions.',
								'jetpack'
							) }
							plan={ getJetpackProductUpsellByFeature( FEATURE_PRIORITY_SUPPORT_JETPACK ) }
							callToAction={ __( 'Connect', 'jetpack' ) }
							onClick={ this.handleConnectClick }
						/>
					) }
			</div>
		);
	}
}

SupportCard.propTypes = {
	siteConnectionStatus: PropTypes.any.isRequired,
	className: PropTypes.string,
	isCurrentUserLinked: PropTypes.string,
	isConnectionOwner: PropTypes.bool,
};

export default connect(
	state => {
		return {
			sitePlan: getSitePlan( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isFetchingSiteData: isFetchingSiteData( state ),
			isAtomicSite: isAtomicSite( state ),
			isDevVersion: _isDevVersion( state ),
			supportUpgradeUrl: getUpgradeUrl( state, 'support' ),
			isCurrentUserLinked: isCurrentUserLinked( state ),
			isConnectionOwner: isConnectionOwner( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( SupportCard );
