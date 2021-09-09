/**
 * External Dependencies
 */
import React from 'react';

const StepSurvey = props => {
	const { onExit, onFeedBackProvided } = props;

	return (
		<div>
			<p>Survey Step</p>
			{ /* Include survey contents and handle submission */ }
			<a href="#" onClick={ onFeedBackProvided }>
				Submit Feedback!
			</a>
			<a href="#" onClick={ onExit }>
				No, thanks.
			</a>
		</div>
	);
};

export default StepSurvey;
