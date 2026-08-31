import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Footer from 'components/footer';
import Masthead from 'components/masthead';
import { setInitialState } from 'state/initial-state';

class StaticMain extends Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState();
	}

	render() {
		return (
			<div id="jp-plugin-container">
				<div className="jp-top">
					<div className="jp-top-inside">
						<Masthead { ...this.props } />
					</div>
				</div>
				<div className="jp-loading-placeholder">
					<span className="spinner is-active" style={ { float: 'none' } } />
				</div>
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
