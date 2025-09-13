import { TextareaControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';

export const CountedTextArea = ( { suggestedLimit, value, label, ...inputProps } ) => {
	const help =
		! suggestedLimit || value.length <= suggestedLimit
			? sprintf(
					/* translators: %d: the number of characters in a sentence. */
					_n( '%d character', '%d characters', value.length, 'jetpack' ),
					value.length
			  )
			: sprintf(
					/* translators: %1$d: suggested character limit, %2$d: number of characters in a sentence. */
					__(
						'It is recommended to use less than %1$d characters in this field. (%2$d/%1$d)',
						'jetpack'
					),
					suggestedLimit,
					value.length
			  );

	return (
		<div className="jetpack-seo-message-box">
			<TextareaControl
				__nextHasNoMarginBottom={ true }
				label={ label }
				help={ help }
				value={ value }
				{ ...inputProps }
			/>
		</div>
	);
};
