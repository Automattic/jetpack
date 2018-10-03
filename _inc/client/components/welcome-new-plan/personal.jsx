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
	componentDidMount() {
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_view', {
			planClass: this.props.planClass,
		} );
	}

	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'Thanks for choosing Jetpack Personal. Jetpack is now backing up your site and ' +
						'scanning for security threats.'
					) }
				</p>
				<img src={ imagePath + 'customize-theme.svg' } className="jp-welcome__svg" alt={ __( 'Themes' ) } />
				<p>
					{ __( 'With Jetpack Personal, you have access to more than 100 free, professionally-designed WordPress ' +
						'themes. Choose the theme that best fits your site and customize colors, images, or add a variety of ' +
						'new widgets.'
					) }
				</p>
				<MonitorAkismetBackupsPrompt />
				<Button
					className="jp-welcome-new-plan__button"
					href={ '#/traffic' }
					onClick={ this.props.dismiss }
					primary
				>
					{ __( 'Got it!' ) }
				</Button>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'connect-jetpack.svg' } width="160" alt={ __( 'Welcome personal' ) } style={ { paddingLeft: '60px' } } /> }
				title={ __( 'Your Jetpack Personal plan is powering up!' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-personal"
			/>
		);
	}
}

WelcomePersonal.propTypes = {
	dismiss: PropTypes.func
};

export default WelcomePersonal;
