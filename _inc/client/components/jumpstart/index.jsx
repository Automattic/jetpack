/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
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
			<div>
				<h2>Jump Start?</h2>
				<Button primary={ true } onClick={ this.props.jumpStartActivate }>Enable Default Features</Button>
				<br />
				<Button onClick={ this.props.jumpStartSkip } >Skip</Button>
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
