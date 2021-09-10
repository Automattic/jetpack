/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { TextareaControl } from '@wordpress/components';

export default function MessageBox( { message = '', onChange, disabled, maxLength } ) {
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
