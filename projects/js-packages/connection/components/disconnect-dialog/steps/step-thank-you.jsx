/**
 * External Dependencies
 */
import React from 'react';

const StepThankYou = props => {
	const { onExit } = props;

	return (
		<div>
			<p>Thank you for providing feedback.</p>
			<a href="#" onClick={ onExit }>
				Back to my site.
			</a>
		</div>
	);
};

export default StepThankYou;
