/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Card from 'components/card';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	jumpStartSkip,
	getJumpStartStatus
} from 'state/jumpstart';

const JumpStart = React.createClass( {
	render: function() {
		return (
			<div className="jp-jumpstart">
				<h2 className="jp-jumpstart__title">Jump Start your site</h2>
				<Card className="jp-jumpstart__cta">
				<p className="jp-jumpstart__description">Quickly enhance your site by activating Jetpack's default features.</p>
					<Button primary={ true } onClick={ this.props.jumpStartActivate }>Enable Default Features</Button>
						
					<Card className="jp-jumpstart__features">
						<p className="jp-jumpstart__description">According to our users, these Jetpack default features are the most useful.</p>

						<ul className="jp-jumpstart__feature-list">
							<li>Detailed Site Statistics</li>
							<li>Automatic Site Security</li>
							<li>Single Sign On</li>
							<li>Image Performance (Photon)</li>
						</ul>
						<ul className="jp-jumpstart__feature-list">
							<li>Automatic Updates (Site Manangement)</li>
							<li>Anti-spam (Akismet)</li>
							<li>Downtime Monitoring</li>
							<li>Related Posts</li>
						</ul>
					</Card>
				</Card>
				<a onClick={ this.props.jumpStartSkip } title="Skip the Jetpack Jumpstart process">Skip</a>
			</div>
		);
	}
} );

export default connect(
	state => {
		return state;
	},
	dispatch => bindActionCreators( { jumpStartActivate, jumpStartSkip }, dispatch )
)( JumpStart );
