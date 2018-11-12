/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchJitm, isFetchingJitm } from 'state/jitm';

class QueryJitm extends Component {
	static propTypes = { isFetchingJitm: PropTypes.bool };

	static defaultProps = {
		isFetchingJitm: false,
		route: { path: '' }
	};

	componentWillMount() {
		//const message_path = `wp:toplevel_page_jetpack${ this.props.route.path }`;
		const message_path = 'wp:toplevel_page_jetpack';

		if ( ! this.props.isFetchingJitm ) {
			this.props.fetchJitm( message_path );
		}
	}

	render() {
		return null;
	}
}

export default connect(
	( state ) => {
		return { isFetchingJitm: isFetchingJitm( state ) };
	},
	( dispatch ) => {
		return {
			fetchJitm: ( message_path ) => dispatch( fetchJitm( message_path ) )
		};
	}
)( QueryJitm );
