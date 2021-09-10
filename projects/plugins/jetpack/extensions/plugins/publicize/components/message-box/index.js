/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { TextareaControl } from '@wordpress/components';

export default function MessageBox( { message = '', onChange, disabled, maxLength } ) {
	const charactersRemaining = maxLength - message.length;
	const characterCountClass = classnames( 'jetpack-publicize-character-count', {
		'wpas-twitter-length-limit': charactersRemaining <= 0,
	} );

	return (
		<div className="jetpack-publicize-message-box">
			<TextareaControl
				value={ message }
				onChange={ onChange }
				disabled={ disabled }
				maxLength={ maxLength }
				placeholder={ __( 'Write a message for your audience here.', 'jetpack' ) }
				rows={ 4 }
			/>
			<div className={ characterCountClass }>
				{ sprintf(
					/* translators: placeholder is a number. */
					_n( '%d character remaining', '%d characters remaining', charactersRemaining, 'jetpack' ),
					charactersRemaining
				) }
			</div>
		</div>
	);
}
