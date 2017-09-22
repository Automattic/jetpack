/**
 * External dependencies
 */
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants';

class WelcomePremium extends Component {
	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( "Jetpack is backing up your site and checking for security threats. If you'd like, you can " +
						'now {{enableVideo}}enable our premium video player{{/enableVideo}}, ' +
						'and {{adsSettings}}turn on ads{{/adsSettings}} to start generating a bit of cash.', {
							components: {
								enableVideo: <a onClick={ this.props.dismiss } href="#/writing" />,
								adsSettings: <a onClick={ this.props.dismiss } href="#/traffic" />,
							}
					} ) }
				</p>
			</div>
		);
	}

	renderBelowContent() {
		return (
			<div>
				<Card
					href={ '#/writing' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.props.dismiss }
				>
					{ __( 'Enable premium video player' ) }
				</Card>
				<Card
					href={ '#/traffic' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.props.dismiss }
				>
					{ __( 'Enable Ads' ) }
				</Card>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'welcome-premium.svg' } width="250" alt={ __( 'People around page' ) } /> }
				title={ __( 'Your Premium Jetpack plan is powering up!' ) }
				content={ this.renderInnerContent() }
				belowContent={ this.renderBelowContent() }
				dismiss={ this.props.dismiss }
			/>
		);
	}
}

WelcomePremium.propTypes = {
	dismiss: React.PropTypes.func
};

export default WelcomePremium;
