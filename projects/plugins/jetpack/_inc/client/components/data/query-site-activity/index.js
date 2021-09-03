/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchSiteActivity } from 'state/activity';
import { isOfflineMode } from 'state/connection';

class QuerySiteActivity extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isOfflineMode ) {
			this.props.fetchActivity();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isOfflineMode: isOfflineMode( state ),
	} ),
	{
		fetchActivity: () => fetchSiteActivity(),
	}
)( QuerySiteActivity );
