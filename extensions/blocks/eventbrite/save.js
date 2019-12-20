/**
 * External dependencies
 */
import classnames from 'classnames';
import { RichText, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { eventIdFromUrl } from './utils';

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
				id={ `eventbrite-widget-modal-trigger-${ eventId }` }
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
	const { useModal, url } = attributes;

	const eventId = eventIdFromUrl( url );

	if ( useModal ) {
		return saveButton( eventId, attributes );
	}

	return <div id={ `eventbrite-widget-container-${ eventId }` } />;
}
