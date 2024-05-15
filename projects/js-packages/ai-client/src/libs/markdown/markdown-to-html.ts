/**
 * External dependencies
 */
import MarkdownIt from 'markdown-it';
/**
 * Types
 */
import type { Options } from 'markdown-it';

export type Fix = 'list';
type Fixes = {
	[ key in Fix ]: ( content: string ) => string;
};

const fixes: Fixes = {
	list: ( content: string ) => {
		// Fix list indentation
		return content.replace( /<li>\s+<p>/g, '<li>' ).replace( /<\/p>\s+<\/li>/g, '</li>' );
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
