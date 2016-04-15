/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

const jetpackConnect = React.createClass( {
	render: function() {
		return <div>Jetpack is NOT connected!</div>;
	}
} );

export default connect( ( state ) => {
	return state;
} )( jetpackConnect );