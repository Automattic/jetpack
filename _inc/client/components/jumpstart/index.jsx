/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Card from 'components/card';
import Button from 'components/button';
import Spinner from 'components/spinner';

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	jumpStartSkip,
	isJumpstarting as _isJumpstarting
} from 'state/jumpstart';

const JumpStart = React.createClass( {

	displayName: 'JumpStart',

	render: function() {
		return (
			<div className="jp-jumpstart">
				<h2 className="jp-jumpstart__title">Jump Start your Website</h2>
				<Card className="jp-jumpstart__cta-container">
					{ this.props.jumpstarting( this.props ) ? <Spinner /> : null }
					<Card className="jp-jumpstart__cta">
						<p className="jp-jumpstart__description">Quickly enhance your site by activating Jetpack's recommended features.</p>
						<Button primary={ true } onClick={ this.props.jumpStartActivate }>Activate Recommended Features</Button>
					</Card>
					<Card className="jp-jumpstart__features">
						<p className="jp-jumpstart__description">Jetpack's recommended features include:</p>

						<ul className="jp-jumpstart__feature-list">
							<li>Social Sharing Tools</li>
							<li>Image Performance (Photon)</li>
							<li>Single Sign On</li>
							<li>Contact Form</li>
							<li>Related Posts</li>
						</ul>
						<ul className="jp-jumpstart__feature-list">
							<li>Automatic Updates (Site Manangement)</li>
							<li>Image Carousel</li>
							<li>Gravatar Hovercards</li>
							<li>Visitor Subscriptions</li>
						</ul>
						<p className="jp-jumpstart__note">Features can be activated or deactivated at any time.</p>
					</Card>
				</Card>
				<a onClick={ this.props.jumpStartSkip } className="jp-jumpstart__skip-step" title="Skip the Jetpack Jumpstart process">Skip this step</a>
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			jumpstarting: () => _isJumpstarting( state )
		};
	},
	dispatch => bindActionCreators( { jumpStartActivate, jumpStartSkip }, dispatch )
)( JumpStart );
