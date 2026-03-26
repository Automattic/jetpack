import { sanitizeHtml } from '../sanitize-html';

describe( 'sanitizeHtml', () => {
	test( 'preserves safe formatting tags', () => {
		const input = '<b>Bold</b> <em>italic</em> <strong>strong</strong>';
		expect( sanitizeHtml( input ) ).toBe( '<b>Bold</b> <em>italic</em> <strong>strong</strong>' );
	} );

	test( 'strips style attributes', () => {
		const input = '<div style="padding: 12px;"><span style="color: red;">text</span></div>';
		expect( sanitizeHtml( input ) ).toBe( '<div><span>text</span></div>' );
	} );

	test( 'preserves br tags', () => {
		const input = 'line one<br>line two';
		expect( sanitizeHtml( input ) ).toBe( 'line one<br>line two' );
	} );

	test( 'removes script tags', () => {
		const input = '<b>Safe</b><script>alert("xss")</script>';
		expect( sanitizeHtml( input ) ).toBe( '<b>Safe</b>' );
	} );

	test( 'removes img tags with onerror handlers', () => {
		const input = '<b>Safe</b><img src=x onerror="alert(document.cookie)">';
		expect( sanitizeHtml( input ) ).toBe( '<b>Safe</b>' );
	} );

	test( 'removes iframe tags', () => {
		const input = '<div>text</div><iframe src="https://evil.com"></iframe>';
		expect( sanitizeHtml( input ) ).toBe( '<div>text</div>' );
	} );

	test( 'removes event handler attributes from allowed tags', () => {
		const input = '<div onclick="alert(1)" onmouseover="steal()">text</div>';
		expect( sanitizeHtml( input ) ).toBe( '<div>text</div>' );
	} );

	test( 'removes javascript: URLs from href', () => {
		const input = '<a href="javascript:alert(1)">click</a>';
		expect( sanitizeHtml( input ) ).toBe( '<a>click</a>' );
	} );

	test( 'preserves safe href values', () => {
		const input = '<a href="https://example.com" target="_blank" rel="noopener">link</a>';
		expect( sanitizeHtml( input ) ).toBe(
			'<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>'
		);
	} );

	test( 'removes object and embed tags', () => {
		const input = '<div>safe</div><object data="x"></object><embed src="y">';
		expect( sanitizeHtml( input ) ).toBe( '<div>safe</div>' );
	} );

	test( 'removes form tags but preserves safe child content', () => {
		const input = '<form action="https://evil.com"><div>trap</div></form>';
		const result = sanitizeHtml( input );
		expect( result ).not.toContain( '<form' );
		expect( result ).not.toContain( 'action' );
		expect( result ).toContain( '<div>trap</div>' );
	} );

	test( 'handles complex tooltip HTML and strips style attributes', () => {
		const input = `<div style="padding: 12px; font-family: sans-serif;">
			<div style="font-weight: bold;">United States</div>
			<div style="color: #666;">Orders: <strong>1,000</strong></div>
		</div>`;
		const result = sanitizeHtml( input );
		expect( result ).toContain( 'United States' );
		expect( result ).toContain( '<strong>1,000</strong>' );
		expect( result ).not.toContain( 'style' );
	} );

	test( 'handles empty string', () => {
		expect( sanitizeHtml( '' ) ).toBe( '' );
	} );

	test( 'handles plain text', () => {
		expect( sanitizeHtml( 'just text' ) ).toBe( 'just text' );
	} );

	test( 'removes disallowed attributes like id and style', () => {
		const input = '<div id="evil" style="color: red;">text</div>';
		expect( sanitizeHtml( input ) ).toBe( '<div>text</div>' );
	} );

	test( 'enforces rel="noopener noreferrer" on target="_blank" links', () => {
		const input = '<a href="https://example.com" target="_blank">link</a>';
		expect( sanitizeHtml( input ) ).toBe(
			'<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>'
		);
	} );

	test( 'overrides insufficient rel on target="_blank" links', () => {
		const input = '<a href="https://example.com" target="_blank" rel="noopener">link</a>';
		expect( sanitizeHtml( input ) ).toBe(
			'<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>'
		);
	} );
} );
