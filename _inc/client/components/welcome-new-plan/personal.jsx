/**
 * External dependencies
 */
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants';

class WelcomePersonal extends Component {
	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'Jetpack is backing up your site and checking for security threats. Your site is now safe and sound!' ) }
				</p>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'welcome-personal.svg' } width="250" alt={ __( 'People around page' ) } /> }
				title={ __( 'Your Personal Jetpack plan is powering up!' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
			/>
		);
	}
}

WelcomePersonal.propTypes = {
	dismiss: React.PropTypes.func
};

export default WelcomePersonal;
