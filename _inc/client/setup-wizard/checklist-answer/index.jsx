/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import './style.scss';

class ChecklistAnswer extends Component {
	constructor( props ) {
		super( props );
		this.state = { checked: false };
	}

	toggleCheckbox = () => {
		this.setState( { checked: ! this.state.checked } );
	};

	render() {
		return (
			<div
				className="jp-checklist-answer-container"
				onClick={ this.toggleCheckbox }
				onKeyPress={ this.toggleCheckbox }
				role="checkbox"
				aria-checked={ this.state.checked }
				tabIndex={ 0 }
			>
				<div className="jp-checklist-answer-checkbox-container">
					<input type="checkbox" tabIndex={ -1 } checked={ this.state.checked } />
				</div>
				<div className="jp-checklist-answer-title">{ this.props.title }</div>
				<div className="jp-checklist-answer-details">{ this.props.details }</div>
			</div>
		);
	}
}

ChecklistAnswer.propTypes = {
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
};

export { ChecklistAnswer };
