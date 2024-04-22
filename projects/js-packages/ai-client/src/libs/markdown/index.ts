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

const renderHTMLFromMarkdown = ( {
	content,
	rules = 'all',
}: {
	content: string;
	rules?: Array< HTMLFix > | 'all';
} ) => {
	return defaultMarkdownConverter.render( { content, rules } );
};

const renderMarkdownFromHTML = ( { content }: { content: string } ) => {
	return defaultHTMLConverter.render( { content } );
};

export { MarkdownToHTML, HTMLToMarkdown, renderHTMLFromMarkdown, renderMarkdownFromHTML };
