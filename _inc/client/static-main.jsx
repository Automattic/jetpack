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
import LoadingPlaceholder from 'components/loading-placeholder';
import { setInitialState } from 'state/initial-state';
import Footer from 'components/footer';

class StaticMain extends React.Component {
	componentWillMount() {
		this.props.setInitialState();
	}

	render() {
		return (
			<div id="jp-plugin-container">
				<Masthead { ...this.props } />
				<LoadingPlaceholder { ...this.props } />
				<Footer { ...this.props } />
			</div>
		);
	}
}

export default connect(
	state => {
		return state;
	},
	dispatch => bindActionCreators( { setInitialState }, dispatch )
)( StaticMain );
