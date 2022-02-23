/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import MarkdownIt from 'markdown-it';
import { RawHTML } from '@wordpress/element';
import { __experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles } from '@wordpress/block-editor';

/**
 * Module variables
 */
const markdownConverter = new MarkdownIt();
const handleLinkClick = event => {
	if ( event.target.nodeName === 'A' ) {
		const hasConfirmed = window.confirm(
			__( 'Are you sure you wish to leave this page?', 'jetpack' )
		);

		if ( ! hasConfirmed ) {
			event.preventDefault();
		}
	}
};

const getStyles = ( attributes = {} ) => {
	const spacingProps = getSpacingClassesAndStyles?.( attributes );
	return spacingProps?.style ? spacingProps.style : {};
};

export default ( { className, source = '', attributes } ) => (
	<RawHTML className={ className } onClick={ handleLinkClick } style={ getStyles( attributes ) }>
		{ source.length ? markdownConverter.render( source ) : '' }
	</RawHTML>
);
