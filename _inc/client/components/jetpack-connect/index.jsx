/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

const JetpackConnect = React.createClass( {
	render: function() {
		return <a href={ window.Initial_State.connectUrl }>click to connect</a>;
	}
} );

export default connect( ( state ) => {
	return state;
} )( JetpackConnect );