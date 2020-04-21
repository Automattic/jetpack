/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

const ChecklistAnswer = props => {
	return (
		<>
			<div>{ props.title }</div>
			<div>{ props.details }</div>
		</>
	);
};

ChecklistAnswer.propTypes = {
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
};

export { ChecklistAnswer };
