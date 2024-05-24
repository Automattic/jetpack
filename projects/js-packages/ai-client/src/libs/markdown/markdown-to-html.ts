/**
 * External dependencies
 */
import MarkdownIt from 'markdown-it';
/**
 * Types
 */
import type { Options } from 'markdown-it';

export type Fix = 'list' | 'paragraph' | 'listItem';

const addListComments = ( content: string ) => {
	return (
		content
			// Add Gutenberg comments to <li> tags
			.replaceAll( '<li>', '<!-- wp:list-item --><li >' )
			.replaceAll( '</li>', '</li ><!-- /wp:list-item -->' )
			// Add Gutenberg comments to <ol> tags
			.replaceAll( '<ol>', '<!-- wp:list {"ordered":true} --><ol >' )
			.replaceAll( '</ol>', '</ol ><!-- /wp:list -->' )
			// Add Gutenberg comments to <ul> tags
			.replaceAll( '<ul>', '<!-- wp:list --><ul >' )
			.replaceAll( '</ul>', '</ul ><!-- /wp:list -->' )
	);
};

type Fixes = {
	[ key in Fix ]: ( content: string ) => string;
};
const fixes: Fixes = {
	list: ( content: string ) => {
		return addListComments(
			// Fix list indentation
			content.replace( /<li>\s+<p>/g, '<li>' ).replace( /<\/p>\s+<\/li>/g, '</li>' )
		);
	},
	listItem: ( content: string ) => {
		return addListComments(
			content
				// Remove wrapping <ul> or <ol> tag
				.replace( /^<[ou]l>\s*/g, '' )
				.replace( /\s*<\/[ou]l>\s*$/g, '' )
		);
	},
	paragraph: ( content: string ) => {
		// Fix encoding of <br /> tags
		return content.replaceAll( /\s*&lt;br \/&gt;\s*/g, '<br />' );
	},
};

const defaultMarkdownItOptions: Options = {
	breaks: true,
};

export default class MarkdownToHTML {
	markdownConverter: MarkdownIt;

	constructor( options: Options = defaultMarkdownItOptions ) {
		this.markdownConverter = new MarkdownIt( options );
	}

	/**
	 * Renders HTML from Markdown content with specified processing rules.
	 * @param {object} options         - The options to use when rendering the HTML content
	 * @param {string} options.content - The Markdown content to render
	 * @param {string} options.rules   - The rules to apply to the rendered content
	 * @returns {string}                 The rendered HTML content
	 */
	render( { content, rules = 'all' }: { content: string; rules: Array< Fix > | 'all' } ): string {
		const rendered = this.markdownConverter.render( content );
		const rulesToApply = rules === 'all' ? Object.keys( fixes ) : rules;

		return rulesToApply.reduce( ( renderedContent, rule ) => {
			return fixes[ rule ]( renderedContent );
		}, rendered );
	}
}
