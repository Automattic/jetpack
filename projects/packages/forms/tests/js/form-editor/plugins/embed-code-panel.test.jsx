/**
 * Tests for form-editor/plugins/embed-code-panel.tsx
 *
 * This file tests the EmbedCodePanel component which provides
 * copy buttons for form embed code and shortcode in the editor sidebar.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// Mock WordPress i18n
await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

// Mock WordPress data
let mockPostId = 42;
let mockPostStatus = 'publish';

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: jest.fn( callback => {
		const mockSelect = storeName => {
			expect( storeName ).toBe( 'core/editor' );
			return {
				getCurrentPostId: () => mockPostId,
				getEditedPostAttribute: () => mockPostStatus,
			};
		};
		return callback( mockSelect );
	} ),
} ) );

// Mock WordPress editor
const MockPluginPostStatusInfo = ( { children, className } ) => (
	<div data-testid="post-status-info" className={ className }>
		{ children }
	</div>
);

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	PluginPostStatusInfo: MockPluginPostStatusInfo,
} ) );

// Mock CopyCodeRow to capture text props
const copyCodeRowTexts = [];
await jest.unstable_mockModule( '../../../../src/form-editor/plugins/copy-code-row', () => ( {
	CopyCodeRow: ( { text, label } ) => {
		copyCodeRowTexts.push( text );
		return <div data-testid="copy-code-row">{ label }</div>;
	},
} ) );

// Import component after mocks
const { EmbedCodePanel, EMBED_CODE_PANEL_PLUGIN } = await import(
	'../../../../src/form-editor/plugins/embed-code-panel.tsx'
);

describe( 'EmbedCodePanel', () => {
	beforeEach( () => {
		mockPostId = 42;
		mockPostStatus = 'publish';
		copyCodeRowTexts.length = 0;
	} );

	it( 'follows the jetpack-form-* plugin naming convention', () => {
		expect( EMBED_CODE_PANEL_PLUGIN ).toBe( 'jetpack-form-embed-code-panel' );
	} );

	it( 'renders embed code and shortcode rows for published posts', () => {
		render( <EmbedCodePanel /> );

		expect( screen.getByText( 'Embed code' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Shortcode' ) ).toBeInTheDocument();
	} );

	it( 'returns null for auto-draft posts', () => {
		mockPostStatus = 'auto-draft';

		const { container } = render( <EmbedCodePanel /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders for draft posts', () => {
		mockPostStatus = 'draft';

		render( <EmbedCodePanel /> );

		expect( screen.getByText( 'Embed code' ) ).toBeInTheDocument();
	} );

	it( 'uses the correct post ID in embed code and shortcode', () => {
		mockPostId = 123;

		render( <EmbedCodePanel /> );

		expect( copyCodeRowTexts ).toContain( '<!-- wp:jetpack/contact-form {"ref":123} /-->' );
		expect( copyCodeRowTexts ).toContain( '[contact-form ref="123"]' );
	} );
} );
