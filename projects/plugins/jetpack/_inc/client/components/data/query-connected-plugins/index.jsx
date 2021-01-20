/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchConnectedPlugins, isFetchingConnectedPlugins } from 'state/site';

class QueryConnectedPlugins extends Component {
	static defaultProps = {
		isFetchingConnectedPlugins: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingConnectedPlugins ) {
			this.props.fetchConnectedPlugins();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingConnectedPlugins: isFetchingConnectedPlugins( state ),
	} ),
	dispatch => ( {
		fetchConnectedPlugins: () => {
			dispatch( fetchConnectedPlugins() );
		},
	} )
)( QueryConnectedPlugins );
