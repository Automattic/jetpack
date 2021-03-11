/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchLicenses, isFetchingLicenses } from 'state/licensing';

class QueryLicenses extends Component {
	static propTypes = {
		isFetchingLicenses: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingLicenses: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingLicenses ) {
			this.props.fetchLicenses();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingLicenses: isFetchingLicenses( state ),
		};
	},
	dispatch => ( {
		fetchLicenses: () => {
			dispatch( fetchLicenses() );
		},
	} )
)( QueryLicenses );
