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
import JetpackDialogue from 'components/jetpack-dialogue';
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import MonitorAkismetBackupsPrompt from './monitor-akismet-backups-prompt';

class WelcomePersonal extends Component {
	constructor( props ) {
		super( props );

		// Preparing event handlers once to avoid calling bind on every render
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
						'Thanks for choosing Jetpack Personal. Jetpack is now backing up your site and ' +
							'scanning for security threats.'
					) }
				</p>
				<img
					src={ imagePath + 'customize-theme.svg' }
					className="jp-welcome__svg"
					alt={ __( 'Themes' ) }
				/>
				<p>
					{ __(
						'With Jetpack Personal, you have access to more than 100 free, professionally-designed WordPress ' +
							'themes. Choose the theme that best fits your site and customize colors, images, or add a variety of ' +
							'new widgets.'
					) }
				</p>
				<MonitorAkismetBackupsPrompt />
				<div className="jp-welcome-new-plan__button">
					<Button onClick={ this.clickCtaDismissGetStarted }>{ __( 'Got it' ) }</Button>
				</div>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={
					<img
						src={ imagePath + 'connect-jetpack.svg' }
						width="160"
						alt={ __( 'Welcome personal' ) }
						style={ { paddingLeft: '60px' } }
					/>
				}
				title={ __( 'Explore your Jetpack Personal plan!' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-personal"
			/>
		);
	}
}

WelcomePersonal.propTypes = {
	dismiss: PropTypes.func,
};

export default WelcomePersonal;
