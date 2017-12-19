/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';

class WelcomeProfessional extends Component {
	constructor( props ) {
		super( props );

		// Preparing event handlers once to avoid calling bind on every render
		this.clickCtaDismissThemes = this.clickCtaDismiss.bind( this, 'themes' );
		this.clickCtaDismissAds = this.clickCtaDismiss.bind( this, 'ads' );
		this.clickCtaDismissSeo = this.clickCtaDismiss.bind( this, 'seo' );
	}

	componentDidMount() {
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_view', {
			planClass: this.props.planClass,
		} );
	}

	clickCtaDismiss( cta ) {
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_click', {
			planClass: this.props.planClass,
			cta: cta,
		} );

		this.props.dismiss();
	}

	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'Thanks for choosing a Jetpack Professional plan. Jetpack is now backing up your content,' +
						' scanning for security threats, and granting access to premium themes.'
					) }
				</p>
				<img src={ imagePath + 'customize-theme.svg' } className="jp-welcome__svg" alt={ __( 'Themes' ) } />
				<p>
					{ __( 'With Jetpack Professional, you can create the perfect site with one of over 300 professionally-designed' +
						' WordPress themes, including more than 100 premium themes. Customize your content with a variety of ' +
						'widgets, or add unlimited videos to your posts and pages -- displayed free of ads or watermarks.'
					) }
				</p>
				<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'Sharing' ) } />
				<p>
					{ __( 'Growing your following is easy with your Professional plan, thanks to content sharing and scheduling,' +
						' SEO tools, and built-in subscription options. You can monetize your site with a simple payment button ' +
						'and in-line ads, and monitor the success of your efforts by integrating with Google Analytics.'
					) }
				</p>
				<img src={ imagePath + 'security.svg' } className="jp-welcome__svg" alt={ __( 'Security' ) } />
				<p>
					{ __( 'Jetpack Professional gives you everything you need to keep your hard work safe, including ' +
						'on-demand backups and malware scans with one-click restores and issue resolution. Your site will ' +
						'be fully protected against spam, malicious code, and brute force login attempts.'
					) }
				</p>
				<p>
					{ __( 'Start exploring Jetpack Professional now to see all the benefits of your new plan.' ) }
				</p>
			</div>
		);
	}

	renderBelowContent() {
		return (
			<div>
				<Card
					href={ 'https://wordpress.com/themes/premium/' + this.props.siteRawUrl }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.clickCtaDismissThemes }
				>
					{ __( 'Install premium themes' ) }
				</Card>
				<Card
					href={ '#/traffic' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.clickCtaDismissAds }
				>
					{ __( 'Monetize your site with ads' ) }
				</Card>
				<Card
					href={ '#/traffic' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.clickCtaDismissSeo }
				>
					{ __( 'Review SEO features' ) }
				</Card>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'people-around-page.svg' } width="250" alt={ __( 'Welcome Professional' ) } /> }
				title={ __( 'Your Jetpack Professional plan is taking care of business!' ) }
				content={ this.renderInnerContent() }
				belowContent={ this.renderBelowContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-professional"
			/>
		);
	}
}

WelcomeProfessional.propTypes = {
	dismiss: PropTypes.func
};

export default WelcomeProfessional;
