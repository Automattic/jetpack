import { getRedirectUrl, UpsellBanner } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import jetpackManageIcon from './jetpack-manage.svg';

class JetpackManageBanner extends React.Component {
	static propTypes = {
		path: PropTypes.string,
		isUserLinked: PropTypes.bool,
		isOwner: PropTypes.bool,
		isFetchingData: PropTypes.bool,
		isAgencyAccount: PropTypes.bool,
	};

	static defaultProps = {
		isUserLinked: false,
		isOwner: false,
		isAgencyAccount: false,
	};

	trackEvent = target => {
		analytics.tracks.recordJetpackClick( {
			target: target,
			feature: 'agencies',
			page: this.props.path,
			is_user_wpcom_connected: this.props.isUserLinked ? 'yes' : 'no',
			is_connection_owner: this.props.isOwner ? 'yes' : 'no',
		} );
	};

	handleLearnMoreClick = useCallback( () => {
		this.trackEvent( 'jp-manage-learn-more-click' );
	}, [ this.trackEvent ] );

	handleManageSitesClick = useCallback( () => {
		this.trackEvent( 'jp-manage-sites-click' );
	}, [ this.trackEvent ] );

	handleSignUpForFreeClick = useCallback( () => {
		this.trackEvent( 'jp-manage-sign-up' );
	}, [ this.trackEvent ] );

	render() {
		const redirectOrigin = 'jetpack-at-a-glance';

		// Set up the first CTA
		const ctaLearnMoreLabel = __( 'Learn more', 'jetpack' );
		const ctaLearnMoreUrl = getRedirectUrl( `${ redirectOrigin }-to-jetpack-manage-learn-more` );

		// Set up the second CTA
		const ctaManageSitesLabel = __( 'Manage sites', 'jetpack' );
		const ctaManageSitesUrl = getRedirectUrl( `${ redirectOrigin }-to-jetpack-manage-dashboard` );

		const ctaSignUpForFreeLabel = __( 'Sign up for free', 'jetpack' );
		const ctaSignUpForFreeUrl = getRedirectUrl( `${ redirectOrigin }-to-jetpack-manage-sign-up` );

		return (
			<UpsellBanner
				icon={ jetpackManageIcon }
				title={ __( "Manage your clients' sites with ease", 'jetpack' ) }
				description={ __(
					'Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention. Plus, get bulk discounts.',
					'jetpack'
				) }
				secondaryCtaLabel={ ctaLearnMoreLabel }
				secondaryCtaURL={ ctaLearnMoreUrl }
				secondaryCtaIsExternalLink={ true }
				secondaryCtaOnClick={ this.handleLearnMoreClick }
				primaryCtaLabel={ this.props.isAgencyAccount ? ctaManageSitesLabel : ctaSignUpForFreeLabel }
				primaryCtaURL={ this.props.isAgencyAccount ? ctaManageSitesUrl : ctaSignUpForFreeUrl }
				primaryCtaIsExternalLink={ true }
				primaryCtaOnClick={
					this.props.isAgencyAccount ? this.handleManageSitesClick : this.handleSignUpForFreeClick
				}
			/>
		);
	}
}

export default JetpackManageBanner;
