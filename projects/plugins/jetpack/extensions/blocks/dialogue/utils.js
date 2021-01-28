/**
 * External dependencies
 */
import classnames from 'classnames';

export function getParticipantLabelClass( baseClassName, participant ) {
	return classnames( `${ baseClassName }__participant`, {
		[ 'has-bold-style' ]: participant?.hasBoldStyle,
		[ 'has-italic-style' ]: participant?.hasItalicStyle,
		[ 'has-uppercase-style' ]: participant?.hasUppercaseStyle,
	} );
}
