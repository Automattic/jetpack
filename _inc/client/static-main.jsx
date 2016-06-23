/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import Masthead from 'components/masthead';
import { setInitialState } from 'state/initial-state';
import Footer from 'components/footer';

const StaticMain = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	render: function() {
		return (
			<div>
				<Masthead { ...this.props } />
				<Footer { ...this.props } />
			</div>
		);
	}

} );

export default connect(
	state => {
		return state;
	},
	dispatch => bindActionCreators( { setInitialState }, dispatch )
)( StaticMain );
