import { __experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles } from '@wordpress/block-editor'; // eslint-disable-line wpcalypso/no-unsafe-wp-apis
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MarkdownIt from 'markdown-it';

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
