/**
 * External dependencies
 */
import classNames from 'classnames';
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
		<div
			className={ classNames( 'jp-recommendations-question__main', {
				'jp-recommendations-question__main--with-illustration': !! illustrationPath,
			} ) }
		>
			<div className="jp-recommendations-question__content">
				<div className="jp-recommendations-question__progress-bar">{ progressBar }</div>
				<h1 className="jp-recommendations-question__question">{ question }</h1>
				<p className="jp-recommendations-question__description">{ description }</p>
				<div className="jp-recommendations-question__answer">{ answer }</div>
			</div>
			{ illustrationPath && (
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
			) }
		</div>
	);
};

PromptLayout.propTypes = {
	answer: PropTypes.element.isRequired,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	illustrationPath: PropTypes.string,
	progressBar: PropTypes.element.isRequired,
	question: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
};

export { PromptLayout };
