/**
 * External dependencies
 *
 * @format
 */

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import { imagePath } from 'constants/urls';
import {
	jumpStartActivate,
	jumpStartSkip,
	isJumpstarting as _isJumpstarting,
} from 'state/jumpstart';

class JumpStart extends Component {
	activateButton = () => {
		return (
			<Button
				primary={ true }
				onClick={ this.props.jumpStartActivate }
				disabled={ this.props.isJumpstarting }
			>
				{ this.props.isJumpstarting
					? __( 'Activating recommended features…' )
					: __( 'Activate recommended features' ) }
			</Button>
		);
	};

	dismissLink = () => {
		return (
			<a
				href={ '#/settings' }
				onClick={ this.props.jumpStartSkip }
				className="jp-jumpstart__skip-link"
			>
				{ __( 'Skip and explore features' ) }
			</a>
		);
	};

	render() {
		return (
			<div className="jp-jumpstart">
				<Card className="jp-jumpstart-card__content">
					<div className="jp-jumpstart-card__img">
						<img src={ imagePath + 'man-and-laptop.svg' } alt={ __( 'Person with laptop' ) } />
					</div>
					<div className="jp-jumpstart-card__description">
						<h3 className="jp-jumpstart-card__description-title">
							{ __( 'Your Jetpack site is ready to go!' ) }
						</h3>
						<p className="jp-jumpstart-card__description-text">
							{ __(
								'We’re now collecting stats, securing your site, and enhancing your editing experience. ' +
									'Pretty soon you’ll be able to see everything going on with your site right through Jetpack! Welcome aboard.'
							) }
						</p>
						<p className="jp-jumpstart-card__description-text">
							{ __(
								'Activate Jetpack’s recommended features to get the most out of your site. ' +
									'Don’t worry, features can be activated and deactivated at any time. ' +
									'{{a}}Learn more about recommended features{{/a}}.',
								{
									components: {
										a: (
											<a
												href="https://jetpack.com/support/quick-start-guide/#jumpstart"
												target="_blank"
												rel="noopener noreferrer"
											/>
										),
									},
								}
							) }
						</p>
						<p>{ this.activateButton() }</p>
						{ this.dismissLink() }
					</div>
				</Card>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			isJumpstarting: _isJumpstarting( state ),
		};
	},
	dispatch => bindActionCreators( { jumpStartActivate, jumpStartSkip }, dispatch )
)( JumpStart );
