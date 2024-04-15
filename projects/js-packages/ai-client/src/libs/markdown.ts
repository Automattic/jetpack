/**
 * External dependencies
 */
import MarkdownIt from 'markdown-it';
import type { Options as MarkdownItOptions } from 'markdown-it';

type Fix = 'list';
type Fixes = {
	[ key in Fix ]: ( content: string ) => string;
};

const fixes: Fixes = {
	list: ( content: string ) => {
		// Fix list indentation
		return content.replace( /<li>\s+<p>/g, '<li>' ).replace( /<\/p>\s+<\/li>/g, '</li>' );
	},
};

const defaultMarkdownItOptions: MarkdownItOptions = {
	breaks: true,
};

// Create a new markdown converter with default options.
const defaultMarkdownConverter = new MarkdownIt( defaultMarkdownItOptions );

/**
 * Renders HTML from markdown content with specified processing rules.
 * @param {object} options                              - The options to use when rendering the HTML content
 * @param {string} options.content                      - The markdown content to render
 * @param {string} options.rules                        - The rules to apply to the rendered content
 * @param {MarkdownItOptions} options.markdownItOptions - The options to use with the markdown-it library
 * @returns {string}                                      The rendered HTML content
 */
export function renderHTMLFromMarkdown( {
	content,
	rules,
	markdownItOptions = defaultMarkdownItOptions,
}: {
	content: string;
	rules: Array< Fix > | 'all';
	markdownItOptions?: MarkdownItOptions;
} ): string {
	let markdownConverter = defaultMarkdownConverter;

	// Only create a new markdown converter if options are provided, otherwise use the default one to avoid unnecessary overhead
	if ( markdownItOptions ) {
		markdownConverter = new MarkdownIt( markdownItOptions );
	}

	const rendered = markdownConverter.render( content );
	const rulesToApply = rules === 'all' ? Object.keys( fixes ) : rules;

	return rulesToApply.reduce( ( renderedContent, rule ) => {
		return fixes[ rule ]( renderedContent );
	}, rendered );
}
