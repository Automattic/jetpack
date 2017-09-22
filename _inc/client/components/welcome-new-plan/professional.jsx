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

class WelcomeProfessional extends Component {
	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( "Jetpack is backing up your site and checking for security threats. If you'd like, you can " +
						'now {{installThemes}}install our premium themes{{/installThemes}}, {{enableVideo}}enable our premium video player{{/enableVideo}}, ' +
						'and {{adsSettings}}turn on ads{{/adsSettings}} to start generating a bit of cash.', {
							components: {
								installThemes: <a onClick={ this.props.dismiss } href={ 'https://wordpress.com/themes/premium/' + this.props.siteRawUrl } />,
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
					href={ 'https://wordpress.com/themes/premium/' + this.props.siteRawUrl }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.props.dismiss }
				>
					{ __( 'Install Themes' ) }
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
				svg={ <img src={ imagePath + 'people-around-page.svg' } width="250" alt={ __( 'People around page' ) } /> }
				title={ __( 'Your Professional Jetpack plan is taking care of business!' ) }
				content={ this.renderInnerContent() }
				belowContent={ this.renderBelowContent() }
				dismiss={ this.props.dismiss }
			/>
		);
	}
}

WelcomeProfessional.propTypes = {
	dismiss: React.PropTypes.func
};

export default WelcomeProfessional;
