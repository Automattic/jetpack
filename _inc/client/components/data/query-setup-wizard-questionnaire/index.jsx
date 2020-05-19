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
import { isDevMode } from 'state/connection';

class QuerySetupWizardQuestionnaire extends Component {
	static propTypes = {
		isFetchingSetupWizardQuestionnaire: PropTypes.bool,
		isDevMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingScanStatus: false,
		isDevMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSetupWizardQuestionnaire && ! this.props.isDevMode ) {
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
			isDevMode: isDevMode( state ),
		};
	},
	dispatch => {
		return {
			fetchSetupWizardQuestionnaire: () => dispatch( fetchSetupWizardQuestionnaire() ),
		};
	}
)( QuerySetupWizardQuestionnaire );
