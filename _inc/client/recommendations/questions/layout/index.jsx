/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Style dependencies
 */
import './style.scss';

const QuestionLayout = props => {
	const { answer, description, illustration, progressBar, question } = props;

	return (
		<div className="jp-recommendations-question__main">
			<div className="jp-recommendations-question__content">
				<div className="jp-recommendations-question__progress-bar">{ progressBar }</div>
				<div className="jp-recommendations-question__question">{ question }</div>
				<div className="jp-recommendations-question__description">{ description }</div>
				<div className="jp-recommendations-question__answer">{ answer }</div>
			</div>
			<div className="jp-recommendations-question__illustration">{ illustration }</div>
		</div>
	);
};

QuestionLayout.propTypes = {
	answer: PropTypes.element.isRequired,
	description: PropTypes.string.isRequired,
	illustration: PropTypes.element.isRequired,
	progressBar: PropTypes.element.isRequired,
	question: PropTypes.string.isRequired,
};

export { QuestionLayout };
