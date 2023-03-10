import Footer from 'components/footer';
import LoadingPlaceholder from 'components/loading-placeholder';
import Masthead from 'components/masthead';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setInitialState } from 'state/initial-state';

class StaticMain extends React.Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState();
	}

	render() {
		return (
			<div id="jp-plugin-container">
				<Masthead { ...this.props } />
				<LoadingPlaceholder { ...this.props } />
				<Footer { ...this.props } />
				<style type="text/css">{ '.vp-deactivated{ display: none; }' }</style>
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
