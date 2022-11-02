import { _n, sprintf } from '@wordpress/i18n';
import React from 'react';

export const CountedTextArea = ( { suggestedLimit, ...inputProps } ) => {
	const { value } = inputProps;

	return (
		<div className="jetpack-seo-message-box">
			<textarea { ...inputProps } />
			<div className="jetpack-seo-character-count">
				{ ! suggestedLimit || value.length <= suggestedLimit
					? sprintf(
							/* translators: Placeholder is a number of characters in a sentence. */
							_n( '%d character', '%d characters', value.length, 'jetpack' ),
							value.length
					  )
					: sprintf(
							"It's recommended to use less than %d characters in this field.",
							suggestedLimit
					  ) }
			</div>
		</div>
	);
};
