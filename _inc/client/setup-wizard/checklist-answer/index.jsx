/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

const ChecklistAnswer = props => {
	return (
		<div className="jp-checklist-answer-container">
			<div className="jp-checklist-answer-checkbox-container">
				<input type="checkbox" />
			</div>
			<div className="jp-checklist-answer-title">{ props.title }</div>
			<div className="jp-checklist-answer-details">{ props.details }</div>
		</div>
	);
};

ChecklistAnswer.propTypes = {
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
};

export { ChecklistAnswer };
