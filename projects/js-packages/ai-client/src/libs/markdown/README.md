# Markdown converters

Typescript functions and classes to convert Markdown to and from HTML.

## HTML to Markdown

The HTML to Markdown conversion uses the [Turndown](https://github.com/mixmark-io/turndown) library and supports Turndown's options and rules.

Example:
```typescript
/**
 * External dependencies
 */
import { renderMarkdownFromHTML } from '@automattic/jetpack-ai-client';

const htmlContent = '<strong>Hello world</strong>';
const markdownContent = renderMarkdownFromHTML( { content: htmlContent } );
// **Hello world**
```

To use custom options and rules:
```typescript
/**
 * External dependencies
 */
import { HTMLToMarkdown } from '@automattic/jetpack-ai-client';

const htmlContent = '<strong>Hello world</strong>';
const options = { headingStyle: 'setext' };
const rules = {
	customStrong: {
		filter: [ 'strong' ],
		replacement: function( content: string ) {
				return '***' + content + '***';
		}
 	}
};
const renderer = new HTMLToMarkdown( options, rules );
const markdownContent = renderer.render( { content: htmlContent } );
// ***Hello world***
```

## Markdown to HTML

The Markdown to HTML conversion uses the [markdown-it](https://github.com/markdown-it/markdown-it) library and supports markdown-it's options. It also adds access to common fixes.

Example:
```typescript
/**
 * External dependencies
 */
import { renderHTMLFromMarkdown } from '@automattic/jetpack-ai-client';

const markdownContent = '**Hello world**';
const htmlContent = renderHTMLFromMarkdown( { content: markdownContent, rules: 'all' } ); // 'all' is a default value
// <p><strong>Hello world</strong></p>\n
```

To use custom options and fixes:
```typescript
/**
 * External dependencies
 */
import { MarkdownToHTML } from '@automattic/jetpack-ai-client';

const markdownContent = '**Hello world**';
const options = { breaks: 'false' };
const rules = [ 'list' ];
const renderer = new MarkdownToHTML( options );
const htmlContent = renderer.render( { content: markdownContent, rules } );
// <p><strong>Hello world</strong></p>\n
```

Currently `rules` only supports `'all'` and `['list']`. Further specific fixes can be added when necessary.
