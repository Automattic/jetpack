/**
 * Internal dependencies
 */
import HTMLToMarkdown from './html-to-markdown.js';
import MarkdownToHTML from './markdown-to-html.js';
/**
 * Types
 */
import type { Fix as HTMLFix } from './markdown-to-html.js';

const defaultMarkdownConverter = new MarkdownToHTML();
const defaultHTMLConverter = new HTMLToMarkdown();

export type RenderHTMLRules = Array< HTMLFix >;

const renderHTMLFromMarkdown = ( {
	content,
	rules,
	extension,
}: {
	content: string;
	rules?: RenderHTMLRules;
	extension?: boolean;
} ) => {
	return defaultMarkdownConverter.render( { content, rules, extension } );
};

const renderMarkdownFromHTML = ( { content }: { content: string } ) => {
	return defaultHTMLConverter.render( { content } );
};

export { MarkdownToHTML, HTMLToMarkdown, renderHTMLFromMarkdown, renderMarkdownFromHTML };
