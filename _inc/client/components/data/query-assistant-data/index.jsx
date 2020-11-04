/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchAssistantData, isFetchingAssistantData } from 'state/assistant';
import { isOfflineMode } from 'state/connection';

class QueryAssistantData extends Component {
	static propTypes = {
		isFetchingAssistantData: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingAssistantData: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingAssistantData && ! this.props.isOfflineMode ) {
			this.props.fetchAssistantData();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => ( {
		isFetchingAssistantData: isFetchingAssistantData( state ),
		isOfflineMode: isOfflineMode( state ),
	} ),
	dispatch => ( { fetchAssistantData: () => dispatch( fetchAssistantData() ) } )
)( QueryAssistantData );
