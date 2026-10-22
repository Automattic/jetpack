import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import McpHub from '../index';
import RemoteAbilitiesSection from '../remote-abilities-section';
import { prepareWpcomMcpUpdate, normalizeWpcomMcpSettings } from '../use-mcp-settings';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const CATALOG = [
	{ name: 'akismet/check-comment', label: 'Check comment', meta: { annotations: {} } },
	{ name: 'akismet/get-stats', label: 'Get stats', meta: { annotations: { readonly: true } } },
	{ name: 'akismet/purge', label: 'Purge spam', meta: { annotations: { destructive: true } } },
];

const withSaved = remoteGroups => ( {
	sites: [ { blog_id: 1, remote_groups: remoteGroups } ],
} );

const onUpdate = jest.fn();

beforeEach( () => onUpdate.mockClear() );

const renderSection = ( { view = 'write', saved = {}, state = {} } = {} ) => {
	render(
		<RemoteAbilitiesSection
			view={ view }
			mcpAbilities={ withSaved( saved ) }
			blogId={ 1 }
			remoteAbilities={ { abilities: CATALOG, isLoading: false, isError: false, ...state } }
			query=""
			savingToolIds={ new Set() }
			onUpdate={ onUpdate }
		/>
	);
};

const sentGroups = () => onUpdate.mock.calls[ 0 ][ 0 ].sites[ 0 ].remote_groups;

describe( 'RemoteAbilitiesSection', () => {
	test( 'Write lists write and destructive abilities, Read lists only reads', async () => {
		renderSection( { view: 'write' } );
		await userEvent.click( screen.getByRole( 'button', { name: 'Show operations' } ) );
		expect( screen.getByRole( 'switch', { name: 'Check comment' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'switch', { name: 'Purge spam' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'switch', { name: 'Get stats' } ) ).not.toBeInTheDocument();
	} );

	test.each( [
		[
			'enabling writes every group key and overwrites stale ability denies',
			true,
			{ 'write:akismet/check-comment': false },
			{
				'write:akismet': true,
				'destructive:akismet': true,
				'write:akismet/check-comment': true,
			},
		],
		[
			'disabling also clears saved ability-level trues',
			false,
			{
				'write:akismet': true,
				'destructive:akismet': true,
				'write:akismet/check-comment': true,
			},
			{
				'write:akismet': false,
				'destructive:akismet': false,
				'write:akismet/check-comment': false,
			},
		],
	] )( 'Enable all: %s', async ( name, enable, saved, expected ) => {
		renderSection( { saved } );
		const toggle = screen.getAllByRole( 'switch', { name: 'Enable all' } )[ 0 ];
		await userEvent.click( toggle );
		expect( sentGroups() ).toEqual( expected );
	} );

	test( 'an ability toggle writes only its own ability key', async () => {
		renderSection();
		await userEvent.click( screen.getByRole( 'button', { name: 'Show operations' } ) );
		await userEvent.click( screen.getByRole( 'switch', { name: 'Check comment' } ) );
		expect( sentGroups() ).toEqual( { 'write:akismet/check-comment': true } );
	} );

	test( 'shows saved groups with a notice when the catalog cannot be loaded', () => {
		renderSection( { saved: { 'write:akismet': true }, state: { abilities: [], isError: true } } );
		expect( screen.getByText( 'Akismet' ) ).toBeInTheDocument();
		expect( screen.getByText( /can’t be loaded right now/ ) ).toBeInTheDocument();
	} );
} );

describe( 'McpHub badges', () => {
	test( 'count published abilities, so a site group that is off is not "All enabled"', () => {
		render(
			<McpHub
				mcpAbilities={ {
					account: { some_tool: { title: 'Some tool', enabled: true, readonly: true } },
					sites: [
						{ blog_id: 1, site_level_enabled: true, remote_groups: { 'read:akismet': false } },
					],
				} }
				blogId={ 1 }
				activityLogUrl=""
				savingToolIds={ new Set() }
				onNavigate={ jest.fn() }
				onUpdate={ jest.fn() }
				remoteAbilities={ { abilities: CATALOG, isLoading: false, isError: false } }
			/>
		);
		expect( screen.getByText( '1 of 2 enabled' ) ).toBeInTheDocument();
	} );

	test( 'unsaved remote abilities follow the enabled WordPress.com tools', () => {
		render(
			<RemoteAbilitiesSection
				view="read"
				mcpAbilities={ withSaved( {} ) }
				blogId={ 1 }
				remoteAbilities={ { abilities: CATALOG, isLoading: false, isError: false } }
				defaultEnabled
				query=""
				savingToolIds={ new Set() }
				onUpdate={ onUpdate }
			/>
		);
		expect( screen.getByRole( 'switch', { name: 'Enable all' } ) ).toBeChecked();
	} );
} );

describe( 'remote_groups settings payload', () => {
	test( 'is read from user_overrides and sent back on update', () => {
		const response = normalizeWpcomMcpSettings(
			{ has_mcp_plan: true, user_overrides: { remote_groups: { 'read:akismet': true } } },
			1
		);
		expect( response.mcp_abilities.sites[ 0 ].remote_groups ).toEqual( { 'read:akismet': true } );
		expect(
			prepareWpcomMcpUpdate( { sites: [ { remote_groups: { 'read:akismet': false } } ] } )
		).toEqual( { remote_groups: { 'read:akismet': false } } );
	} );
} );
