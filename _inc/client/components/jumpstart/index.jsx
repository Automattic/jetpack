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

	dismissLink = () =>
		__( '{{a}}Skip, and explore features individually{{/a}}.', {
			components: {
				a: (
					<a
						href={ '#/settings' }
						onClick={ this.props.jumpStartSkip }
						className="jp-jumpstart__skip-link"
					/>
				),
			},
		} );

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
							{ __( 'We’re now collecting stats and securing your site. Welcome aboard.' ) }
						</p>
						<p className="jp-jumpstart-card__description-text">
							{ __(
								'Next, activate Jetpack’s recommended feature set to maximize your site’s security and performance. ' +
									'{{a}}Learn more about what’s included{{/a}}.',
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
