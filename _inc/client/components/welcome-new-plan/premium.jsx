/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';
import VideoPressPrompt from './videopress-prompt';
import MonitorAkismetBackupsPrompt from './monitor-akismet-backups-prompt';
import InlineModuleToggle from 'components/module-settings/inline-module-toggle';

class WelcomePremium extends Component {
	constructor( props ) {
		super( props );

		// Preparing event handlers once to avoid calling bind on every render
		this.clickCtaDismissVideo = this.clickCtaDismiss.bind( this, 'video' );
		this.clickCtaDismissAds = this.clickCtaDismiss.bind( this, 'ads' );
		this.clickCtaDismissGetStarted = this.clickCtaDismiss.bind( this, 'get-started' );
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
					{ __(
						'Thanks for choosing Jetpack Premium. Jetpack is now backing up your site, scanning for ' +
							' security threats, and enabling monetization features.'
					) }
				</p>
				<img
					src={ imagePath + 'customize-theme.svg' }
					className="jp-welcome__svg"
					alt={ __( 'Themes' ) }
				/>
				<p>
					{ __(
						'With Jetpack Premium, you can create the perfect site, no matter its purpose. Customize your site’s' +
							' appearance with one of more than 100 free themes, or enhance your content with unlimited HD video ' +
							'-- all hosted free of ads or watermarks.'
					) }
				</p>
				<img
					src={ imagePath + 'wordads.svg' }
					className="jp-welcome__svg"
					alt={ __( 'Sharing' ) }
				/>
				<p>
					{ __(
						'Using Jetpack’s powerful sharing tools, you can automatically share your newest posts on social media,' +
							' or schedule your content to be re-shared at any date or time you choose. And along with growing your ' +
							'following, you can grow your business with tools like payment buttons and ads.'
					) }
				</p>
				<InlineModuleToggle module_slug="publicize" />
				<InlineModuleToggle module_slug="wordads" />
				<VideoPressPrompt />
				<MonitorAkismetBackupsPrompt />
				<p>
					{ __( 'Start exploring Jetpack Premium now to see all the benefits of your new plan.' ) }
				</p>
				<div className="jp-welcome-new-plan__button">
					<Button onClick={ this.clickCtaDismissGetStarted }>{ __( 'Got it' ) }</Button>
				</div>
			</div>
		);
	}

	renderBelowContent() {
		return (
			<div>
				<Card
					href={ '#/traffic' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.clickCtaDismissAds }
				>
					{ __( 'Monetize your site with ads' ) }
				</Card>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={
					<img
						src={ imagePath + 'generating-cash-2.svg' }
						width="250"
						alt={ __( 'Welcome Premium' ) }
					/>
				}
				title={ __( 'Explore your Jetpack Premium plan!' ) }
				content={ this.renderInnerContent() }
				belowContent={ this.renderBelowContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-premium"
			/>
		);
	}
}

WelcomePremium.propTypes = {
	dismiss: PropTypes.func,
};

export default WelcomePremium;
