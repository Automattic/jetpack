/**
 * External dependencies
 */
import React from 'react';
<<<<<<< 2a6de4b61463377a8700dc901b01cf20d7ab733b
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	getJumpStartStatus
} from 'state/jumpstart';

const JumpStart = React.createClass( {
=======
import { connect } from 'react-redux';
import Button from 'components/button';

const JumpStart = React.createClass( {


>>>>>>> initial commit
	render: function() {
		return (
			<div>
				<h2>Welcome to Jetpack 4.1!</h2>
<<<<<<< 2a6de4b61463377a8700dc901b01cf20d7ab733b
				<Button primary={ true } onClick={ this.props.jumpStartActivate }>Enable Default Features</Button>
=======
				<Button primary={ true } >Enable Default Features</Button>
>>>>>>> initial commit
				<br />
				<Button>Skip</Button>
			</div>
		);
	}
} );

<<<<<<< 2a6de4b61463377a8700dc901b01cf20d7ab733b
export default connect(
	state => {
		return state;
	},
	dispatch => bindActionCreators( { jumpStartActivate }, dispatch )
)( JumpStart );
=======
export default connect( ( state ) => {
	return state;
} )( JumpStart );
>>>>>>> initial commit
