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

function saveButton( attributes ) {
	const {
		backgroundColor,
		borderRadius,
		customBackgroundColor,
		customTextColor,
		eventId,
		text,
		textColor,
		url,
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

	// Saves link markup, but event handlers are added with inline javascript to prevent
	// default link behavior (see the `jetpack_render_eventbrite_block` php function).
	return (
		<div className="wp-block-button">
			<RichText.Content
				className={ buttonClasses }
				id={ createWidgetId( eventId ) }
				role="button"
				style={ buttonStyle }
				tagName="a"
				href={ url }
				value={ text }
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
		return saveButton( attributes );
	}

	return <div id={ createWidgetId( eventId ) } />;
}
