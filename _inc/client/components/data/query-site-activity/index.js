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
import { isDevMode } from 'state/connection';

class QuerySiteActivity extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool,
	};

	static defaultProps = {
		isDevMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isDevMode ) {
			this.props.fetchActivity();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isDevMode: isDevMode( state ),
	} ),
	{
		fetchActivity: () => fetchSiteActivity(),
	}
)( QuerySiteActivity );
