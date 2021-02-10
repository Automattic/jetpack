/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const PromptLayout = props => {
	const { answer, description, illustrationPath, progressBar, question } = props;

	return (
		<div className="jp-recommendations-question__main">
			<div className="jp-recommendations-question__content">
				<div className="jp-recommendations-question__progress-bar">{ progressBar }</div>
				<h1 className="jp-recommendations-question__question">{ question }</h1>
				<p className="jp-recommendations-question__description">{ description }</p>
				<div className="jp-recommendations-question__answer">{ answer }</div>
			</div>
			<div className="jp-recommendations-question__illustration-container">
				<img
					className="jp-recommendations-question__illustration-background"
					src={ imagePath + 'recommendations/background.svg' }
					alt=""
				/>
				<img
					className="jp-recommendations-question__illustration-foreground"
					src={ imagePath + illustrationPath }
					alt=""
				/>
			</div>
		</div>
	);
};

PromptLayout.propTypes = {
	answer: PropTypes.element.isRequired,
	description: PropTypes.element.isRequired,
	illustration: PropTypes.element.isRequired,
	progressBar: PropTypes.element.isRequired,
	question: PropTypes.element.isRequired,
};

export { PromptLayout };
