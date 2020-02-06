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
 * Uses a "button" element rather than "a", since the button opens a modal rather than
 * an external link.
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
				href={ url }
				id={ createWidgetId( eventId ) }
				rel="noopener noreferrer"
				role="button"
				style={ buttonStyle }
				tagName="a"
				target="_blank"
				value={ text }
			/>
		</div>
	);
}

export default function save( { attributes } ) {
	const { eventId, useModal, url } = attributes;

	if ( ! eventId ) {
		return;
	}

	if ( useModal ) {
		return saveButton( attributes );
	}

	return (
		<div id={ createWidgetId( eventId ) }>
			{ url && (
				<a className="eventbrite__direct-link" href={ url }>
					{ url }
				</a>
			) }
		</div>
	);
}
