import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import McpRead from '../read';
import McpWrite from '../write';

// read.jsx/write.jsx import the webpack-aliased 'lib/analytics', which doesn't
// resolve under jest — provide it virtually. (jest.mock is hoisted above the
// imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const BLOG_ID = 123;

/**
 * Build a minimal mcp_abilities response holding a single tool.
 *
 * @param {object}  options          - Options.
 * @param {boolean} options.readonly - Whether the tool is read-only (read view) or write.
 * @param {boolean} options.enabled  - Initial enabled state.
 * @return {object} mcp_abilities object.
 */
const abilitiesWithTool = ( { readonly, enabled = false } ) => ( {
	account: {
		'wpcom-mcp/posts-list': {
			title: 'List posts',
			description: 'List your posts.',
			enabled,
			readonly,
			requires_opt_in: true,
			category: 'posts',
		},
	},
	sites: [],
} );

const allowlistUpdatedCalls = () =>
	analytics.tracks.recordEvent.mock.calls.filter(
		call => call[ 0 ] === 'jetpack_mcp_allowlist_updated'
	);

beforeEach( () => {
	analytics.tracks.recordEvent.mockClear();
} );

describe( 'jetpack_mcp_allowlist_updated', () => {
	test.each( [
		{ view: 'read', Component: McpRead, readonly: true },
		{ view: 'write', Component: McpWrite, readonly: false },
	] )(
		'per-tool toggle reports ability_name (not tool_id) on the $view view',
		async ( { view, Component, readonly } ) => {
			const onUpdate = jest.fn();
			render(
				<Component
					mcpAbilities={ abilitiesWithTool( { readonly } ) }
					blogId={ BLOG_ID }
					savingToolIds={ new Set() }
					onUpdate={ onUpdate }
				/>
			);

			// Individual tool toggles sit behind the group's "Show operations" chevron.
			await userEvent.click( screen.getByRole( 'button', { name: 'Show operations' } ) );
			await userEvent.click( screen.getByRole( 'switch', { name: 'List posts' } ) );

			// toEqual pins the whole property bag: ability_name present, no tool_id,
			// plus the AI-product-standard audience properties (AIINT-586). This
			// suite injects no jetpackAiSettings, so both default to 'false'.
			expect( allowlistUpdatedCalls() ).toEqual( [
				[
					'jetpack_mcp_allowlist_updated',
					{
						is_a11n: 'false',
						is_test: 'false',
						ability_name: 'wpcom-mcp/posts-list',
						enabled: true,
						view,
					},
				],
			] );
			expect( onUpdate ).toHaveBeenCalledWith( {
				sites: [ { blog_id: BLOG_ID, abilities: { 'wpcom-mcp/posts-list': true } } ],
			} );
		}
	);
} );

describe.each( [
	{ view: 'read', Component: McpRead, readonly: true },
	{ view: 'write', Component: McpWrite, readonly: false },
] )( '$view bulk tool updates', ( { Component, readonly } ) => {
	test.each( [
		{ scope: 'page', toggleIndex: 0 },
		{ scope: 'group', toggleIndex: 1 },
	] )( '$scope "Enable all" leaves opt-in tools alone both ways', async ( { toggleIndex } ) => {
		const onUpdate = jest.fn();
		const settings = ( enabled, optInEnabled = enabled ) => ( {
			account: {
				ordinary: { title: 'Ordinary tool', readonly, enabled },
				opt_in: {
					title: 'Opt-in tool',
					readonly,
					enabled: optInEnabled,
					requires_opt_in: true,
				},
			},
			sites: [ { blog_id: BLOG_ID, site_level_enabled: enabled } ],
		} );
		const props = { blogId: BLOG_ID, savingToolIds: new Set(), onUpdate };
		const { rerender } = render( <Component { ...props } mcpAbilities={ settings( false ) } /> );

		await userEvent.click( screen.getAllByRole( 'switch', { name: 'Enable all' } )[ toggleIndex ] );
		expect( onUpdate ).toHaveBeenLastCalledWith( {
			sites: [ { blog_id: BLOG_ID, abilities: { ordinary: true } } ],
		} );

		rerender( <Component { ...props } mcpAbilities={ settings( true, false ) } /> );
		expect( screen.getAllByRole( 'switch', { name: 'Enable all' } )[ toggleIndex ] ).toBeChecked();
		await userEvent.click( screen.getAllByRole( 'switch', { name: 'Enable all' } )[ toggleIndex ] );
		expect( onUpdate ).toHaveBeenLastCalledWith( {
			sites: [ { blog_id: BLOG_ID, abilities: { ordinary: false } } ],
		} );

		rerender( <Component { ...props } mcpAbilities={ settings( true ) } /> );
		await userEvent.click( screen.getAllByRole( 'switch', { name: 'Enable all' } )[ toggleIndex ] );
		expect( onUpdate ).toHaveBeenLastCalledWith( {
			sites: [ { blog_id: BLOG_ID, abilities: { ordinary: false } } ],
		} );
	} );

	test( 'opt-in tools get their own section without "Enable all"', async () => {
		const onUpdate = jest.fn();
		render(
			<Component
				blogId={ BLOG_ID }
				savingToolIds={ new Set() }
				onUpdate={ onUpdate }
				mcpAbilities={ {
					account: {
						opt_in: { title: 'Opt-in tool', readonly, enabled: false, requires_opt_in: true },
					},
					sites: [ { blog_id: BLOG_ID, site_level_enabled: true } ],
				} }
			/>
		);

		// The only "Enable all" left is the page's, and it has nothing to act on.
		expect( screen.getByRole( 'switch', { name: 'Enable all' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByText( 'Requires individual approval' ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Show operations' } ) );
		await userEvent.click( screen.getByRole( 'switch', { name: 'Opt-in tool' } ) );
		expect( onUpdate ).toHaveBeenCalledWith( {
			sites: [ { blog_id: BLOG_ID, abilities: { opt_in: true } } ],
		} );
	} );
} );
