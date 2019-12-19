/**
 * External dependencies
 */
import PropTypes from 'prop-types';
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
import { PLAN_JETPACK_PERSONAL } from 'lib/plans/constants';
import { isAtomicSite, isDevVersion as _isDevVersion, getUpgradeUrl } from 'state/initial-state';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import { getSiteConnectionStatus } from 'state/connection';
import JetpackBanner from 'components/jetpack-banner';
import { JETPACK_CONTACT_SUPPORT, JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';

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
		} );
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
						<h3 className="jp-support-card__header">{ __( "We're here to help" ) }</h3>
						<p className="jp-support-card__description">
							{ noPrioritySupport
								? __( 'Jetpack comes with free, basic support for all users.' )
								: __( 'Your paid plan gives you access to prioritized Jetpack support.' ) }
						</p>
						<p className="jp-support-card__description">
							<Button
								onClick={ this.trackAskQuestionClick }
								href={
									this.props.isAtomicSite
										? 'https://wordpress.com/help/contact/'
										: jetpackSupportURl
								}
							>
								{ __( 'Ask a question' ) }
							</Button>
							<Button
								onClick={ this.trackSearchClick }
								href={
									this.props.isAtomicSite
										? 'https://wordpress.com/help/'
										: 'https://jetpack.com/support/'
								}
							>
								{ __( 'Search our support site' ) }
							</Button>
						</p>
					</div>
				</Card>
				{ this.props.siteConnectionStatus && noPrioritySupport && (
					<JetpackBanner
						title={ __( 'Get a faster resolution to your support questions.' ) }
						plan={ PLAN_JETPACK_PERSONAL }
						callToAction={ __( 'Upgrade' ) }
						onClick={ this.trackBannerClick }
						href={ this.props.supportUpgradeUrl }
					/>
				) }
			</div>
		);
	}
}

SupportCard.propTypes = {
	siteConnectionStatus: PropTypes.any.isRequired,
	className: PropTypes.string,
};

export default connect( state => {
	return {
		sitePlan: getSitePlan( state ),
		siteConnectionStatus: getSiteConnectionStatus( state ),
		isFetchingSiteData: isFetchingSiteData( state ),
		isAtomicSite: isAtomicSite( state ),
		isDevVersion: _isDevVersion( state ),
		supportUpgradeUrl: getUpgradeUrl( state, 'support' ),
	};
} )( SupportCard );
