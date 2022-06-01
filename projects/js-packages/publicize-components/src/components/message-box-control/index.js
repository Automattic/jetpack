import { TextareaControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Wrapper around a textbox to restrict the number of characters and
 * display how many are remaining.
 *
 * @param {object}   props           - The component's props.
 * @param {string}   props.message   - The message to display.
 * @param {Function} props.onChange  - Callback to invoke as the message changes.
 * @param {boolean}  props.disabled  - Whether the control is disabled.
 * @param {number}   props.maxLength - The maximum character length of the message.
 * @returns {object} The message box component.
 */
export default function MessageBoxControl( { message = '', onChange, disabled, maxLength } ) {
	const charactersRemaining = maxLength - message.length;

	return (
		<TextareaControl
			value={ message }
			onChange={ onChange }
			disabled={ disabled }
			maxLength={ maxLength }
			placeholder={ __( 'Write a message for your audience here.', 'jetpack' ) }
			rows={ 4 }
			help={ sprintf(
				/* translators: placeholder is a number. */
				_n( '%d character remaining', '%d characters remaining', charactersRemaining, 'jetpack' ),
				charactersRemaining
			) }
		/>
	);
}
