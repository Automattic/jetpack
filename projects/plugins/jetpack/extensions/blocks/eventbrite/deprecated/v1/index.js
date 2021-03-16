/**
 * External dependencies
 */
import classnames from 'classnames';
import { RichText, getColorClassName } from '@wordpress/block-editor';
import { isEmpty, omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { _x } from '@wordpress/i18n';

/**
 * Adapted button save function from @wordpress/block-library
 * (Using Gutenberg code that shipped with WordPress 5.3)
 *
 * @see https://github.com/WordPress/gutenberg/blob/wp/5.3/packages/block-library/src/button/save.js
 *
 * Uses a "button" element rather than "a", since the button opens a modal rather than
 * an external link.
 */

const deprecatedAttributes = [
	'text',
	'backgroundColor',
	'textColor',
	'customBackgroundColor',
	'customTextColor',
	'borderRadius',
	'useModal',
];

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

export default {
	attributes: {
		url: {
			type: 'string',
		},
		eventId: {
			type: 'number',
		},
		useModal: {
			type: 'boolean',
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
		const { className } = attributes;

		const newAttributes = {
			...omit( attributes, [ 'useModal', ...deprecatedAttributes ] ),
			className: className && className.replace( 'is-style-outline', '' ),
			style: attributes.useModal ? 'modal' : 'inline',
		};
		const buttonAttributes = pick( attributes, deprecatedAttributes );

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
		const { eventId, useModal, url } = attributes;

		if ( ! eventId ) {
			return;
		}

		if ( useModal ) {
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
	isEligible: ( attributes, innerBlocks ) =>
		'modal' === attributes.style &&
		( isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ) ),
};
