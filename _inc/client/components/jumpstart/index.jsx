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
				<h2>Jump Start your site</h2>
				<Card className="jp-jumpstart__cta">
				<p className="jp-jumpstart__description">Quickly enhance your site by activating Jetpack's default features.</p>
					<Button primary={ true } onClick={ this.props.jumpStartActivate }>Enable Default Features</Button>
					<br />
					<a onClick={ this.props.jumpStartSkip } >Skip</a>
				</Card>
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
