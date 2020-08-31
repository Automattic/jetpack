/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchSetupWizardQuestionnaire,
	isFetchingSetupWizardQuestionnaire,
} from 'state/setup-wizard';
import { isOfflineMode } from 'state/connection';

class QuerySetupWizardQuestionnaire extends Component {
	static propTypes = {
		isFetchingSetupWizardQuestionnaire: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingScanStatus: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSetupWizardQuestionnaire && ! this.props.isOfflineMode ) {
			this.props.fetchSetupWizardQuestionnaire();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingSetupWizardQuestionnaire: isFetchingSetupWizardQuestionnaire( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchSetupWizardQuestionnaire: () => dispatch( fetchSetupWizardQuestionnaire() ),
		};
	}
)( QuerySetupWizardQuestionnaire );
