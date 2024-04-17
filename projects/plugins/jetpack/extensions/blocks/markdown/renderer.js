import { __experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles } from '@wordpress/block-editor'; // eslint-disable-line wpcalypso/no-unsafe-wp-apis
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MarkdownIt from 'markdown-it';
import footnote_plugin from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';

/**
 * Module variables
 */
const markdownConverter = new MarkdownIt( {
	typographer: true,
} )
	.use( footnote_plugin )
	.use( taskLists );

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

const renderMarkdown = source => {
	if ( ! source.length ) {
		return '';
	}

	let html = markdownConverter.render( source );

	// Add inline styles to any to-do lists, found in the html as unordered lists with the .contains-task-list class.
	// This is done to allow for custom styling of the to-do list items.
	html = html.replace(
		/<ul class="contains-task-list">/g,
		'<ul class="contains-task-list" style="list-style: none;">'
	);

	return html;
};
export default ( { className, source = '', attributes } ) => (
	<RawHTML className={ className } onClick={ handleLinkClick } style={ getStyles( attributes ) }>
		{ renderMarkdown( source ) }
	</RawHTML>
);
