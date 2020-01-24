/**
 * External dependencies
 */
import classnames from 'classnames';
import { RichText, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createWidgetId } from './utils';

/**
 * Adapted button save function from @wordpress/block-library
 * (Using Gutenberg code that shipped with WordPress 5.3)
 *
 * @see https://github.com/WordPress/gutenberg/blob/wp/5.3/packages/block-library/src/button/save.js
 *
 * Uses a "button" element rather than "a", since the button opens a modal rather than a link.
 */

/**
 * Adapted button save function from @wordpress/block-library
 * (Using Gutenberg code that shipped with WordPress 5.3)
 *
 * @see https://github.com/WordPress/gutenberg/blob/wp/5.3/packages/block-library/src/button/save.js
 *
 * Uses a "button" element rather than "a", since the button opens a modal rather than
 * an external link.
 *
 * @todo Remove this once WordPress 5.3 is Jetpack's minimum version.
 */

function saveButton( eventId, attributes ) {
	const {
		backgroundColor,
		borderRadius,
		customBackgroundColor,
		customTextColor,
		text,
		textColor,
	} = attributes;

	const textClass = getColorClassName( 'color', textColor );
	const backgroundClass = getColorClassName( 'background-color', backgroundColor );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-text-color': textColor || customTextColor,
		[ textClass ]: textClass,
		'has-background': backgroundColor || customBackgroundColor,
		[ backgroundClass ]: backgroundClass,
		'no-border-radius': borderRadius === 0,
	} );

	const buttonStyle = {
		backgroundColor: backgroundClass ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
	};

	return (
		<div>
			<RichText.Content
				id={ createWidgetId( eventId ) }
				tagName="button"
				className={ buttonClasses }
				style={ buttonStyle }
				value={ text }
				type="button"
			/>
		</div>
	);
}

export default function save( { attributes } ) {
	const { eventId, useModal } = attributes;

	if ( ! eventId ) {
		return;
	}

	if ( useModal ) {
		return saveButton( eventId, attributes );
	}

	return <div id={ createWidgetId( eventId ) } />;
}
