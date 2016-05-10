/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { disconnectSite } from 'state/connection';

const ConnectionSettings = React.createClass( {
	render() {
		return(
			<div>
				<Button onClick={ this.props.disconnectSite } >Disconnect Site</Button>
			</div>
		)
	}
} );

export default connect(
	state => {
		return state;
	},
	dispatch => bindActionCreators( { disconnectSite }, dispatch )
)( ConnectionSettings );

