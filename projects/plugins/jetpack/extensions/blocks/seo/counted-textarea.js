import { _n, sprintf } from '@wordpress/i18n';
import React from 'react';

export const CountedTextArea = inputProps => {
	const { value } = inputProps;

	return (
		<div className="jetpack-seo-message-box">
			<textarea { ...inputProps } />
			<div className="jetpack-seo-character-count">
				{ sprintf(
					/* translators: Placeholder is a number of characters in a sentence. */
					_n( '%d character', '%d characters', value.length, 'jetpack' ),
					value.length
				) }
			</div>
		</div>
	);
};
