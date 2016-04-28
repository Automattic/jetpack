/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getConnectUrl } from 'state/initial-state';

const JetpackConnect = React.createClass( {
	render: function() {
		return <a href={ getConnectUrl( this.props ) }>click to connect</a>;
	}
} );

export default connect( ( state ) => {
	return state;
} )( JetpackConnect );
