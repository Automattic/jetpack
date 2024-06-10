import { RichText, getColorClassName } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { isEmpty, omit, pick, some } from 'lodash';

/**
 * Deprecation reasons:
 * 1. Migration of `useModal` (bool) attribute to `style` (string) to determine block layout.
 * 2. The Eventbrite block's ModalButtonPreview (the return value of saveButton()) has been replaced with the jetpack/button inner block.
 */

// Deprecated properties relating to the block's button within the layout style.
const deprecatedButtonAttributes = [
	'text',
	'backgroundColor',
	'textColor',
	'customBackgroundColor',
	'customTextColor',
	'borderRadius',
];

/**
 * Deprecated save function.
 *
 * Adapted button save function from @wordpress/block-library
 * (Using Gutenberg code that shipped with WordPress 5.3)
 *
 * @see https://github.com/WordPress/gutenberg/blob/wp/5.3/packages/block-library/src/button/save.js
 *
 * Uses a "button" element rather than "a", since the button opens a modal rather than
 * an external link.
 * @param   { object } attributes - Eventbrite block attributes.
 * @returns { string }            - Button markup to save.
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

	const buttonClasses = clsx( 'wp-block-button__link', {
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
				// Placeholder id, preg replaced with a unique id generated in PHP when the block is rendered.
				// IMPORTANT: do not remove or change unless you also update the render function in eventbrite.php.
				id={ `eventbrite-widget-${ eventId }` }
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

const urlValidator = url => ! url || url.startsWith( 'http' );

export default {
	attributes: {
		url: {
			type: 'string',
			validator: urlValidator,
		},
		eventId: {
			type: 'number',
		},
		useModal: {
			type: 'boolean',
		},
		style: {
			type: 'string',
		},
		// Modal button attributes, used for Button & Modal embed type.
		text: {
			type: 'string',
			default: _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		customTextColor: {
			type: 'string',
		},
		borderRadius: {
			type: 'number',
		},
	},

	migrate: attributes => {
		const { className, style } = attributes;

		let layoutStyle = style;

		// The `useModal` (bool) attribute is deprecated in favour of `style` (string)
		if ( ! layoutStyle ) {
			layoutStyle = attributes.useModal ? 'modal' : 'inline';
		}

		const newAttributes = {
			// Remove deprecated attributes.
			...omit( attributes, [ 'useModal', ...deprecatedButtonAttributes ] ),
			className: className && className.replace( 'is-style-outline', '' ),
			style: layoutStyle,
		};

		// Create an object out of available button deprecated properties.
		const buttonAttributes = pick( attributes, deprecatedButtonAttributes );

		// Where a block is eligible for migration (and the layout style is 'modal') we'll return a button block.
		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'a',
				text:
					buttonAttributes.text || _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
				...buttonAttributes,
				uniqueId: 'eventbrite-widget-id',
				className:
					className && -1 !== className.indexOf( 'is-style-outline' ) ? 'is-style-outline' : '',
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},

	save: function save( { attributes } ) {
		const { eventId, useModal, url, style } = attributes;

		if ( ! eventId ) {
			return;
		}

		if ( useModal || style === 'modal' ) {
			return saveButton( attributes );
		}

		return (
			url && (
				<a className="eventbrite__direct-link" href={ url }>
					{ url }
				</a>
			)
		);
	},
	/*
		Check for migration eligibility. We need to migrate a deprecated block if they layout style is modal and:
		1. There are no inner blocks. The latest version contains an inner jetpack/button block.
		2. The blocks attributes contain deprecated properties.
	*/
	isEligible: ( attributes, innerBlocks ) => {
		const isModal = 'modal' === attributes.style || attributes.useModal;
		return (
			isModal &&
			( isEmpty( innerBlocks ) || some( pick( attributes, deprecatedButtonAttributes ), Boolean ) )
		);
	},
};
