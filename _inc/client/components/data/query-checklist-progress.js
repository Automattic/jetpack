/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { isLoading } from 'state/checklist/selectors';
import { requestSiteChecklist } from 'state/checklist/actions';

class QuerySiteChecklist extends Component {
	static propTypes = {
		requestSiteChecklist: PropTypes.func,
		isLoading: PropTypes.bool,
	};

	componentDidMount() {
		if ( ! this.props.isLoading ) {
			this.props.requestSiteChecklist();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isLoading: isLoading( state ),
	} ),
	{ requestSiteChecklist }
)( QuerySiteChecklist );
