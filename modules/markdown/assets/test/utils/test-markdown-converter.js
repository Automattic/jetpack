/**
 * External dependencies
 */
import { expect } from 'chai';
import { describe, it } from 'mocha';

/**
 * Internal dependencies
 */
const MarkdownConverter = require( '../../js/utils/markdown-converter' );

const markdownSource = `
# Heading 1
This is *Markdown* __source__.

With \`inline code\`

Unordered lists:

- Element 1
- Element 2
- Element 3

And ordered:

1. First element
2. Second element
3. Third element


\`\`\`
Fenced code blocks too
\`\`\`

`;

const markdownFullHTML = `<h1>Heading 1</h1>
<p>This is <em>Markdown</em> <strong>source</strong>.</p>
<p>With <code>inline code</code></p>
<p>Unordered lists:</p>
<ul>
<li>Element 1</li>
<li>Element 2</li>
<li>Element 3</li>
</ul>
<p>And ordered:</p>
<ol>
<li>First element</li>
<li>Second element</li>
<li>Third element</li>
</ol>
<pre><code>Fenced code blocks too
</code></pre>
`;

describe( 'MarkdownConverter', () => {
	it( 'can render the complete CommonMark specification', () => {
		expect( MarkdownConverter.render( markdownSource ) ).to.equal( markdownFullHTML );
	} );
} );
