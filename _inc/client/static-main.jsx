/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Masthead from 'components/masthead';
import LoadingPlaceholder from 'components/loading-placeholder';
import { setInitialState } from 'state/initial-state';
import Footer from 'components/footer';

const initialState = {
	dismissedNotices: [],
	connectionStatus: {
		devMode: {
			isActive: false,
		},
	},
	userData: {
		currentUser: {
			permissions: {},
		},
	},
};

class StaticMain extends React.Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState( initialState );
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
	null,
	{ setInitialState }
)( StaticMain );
