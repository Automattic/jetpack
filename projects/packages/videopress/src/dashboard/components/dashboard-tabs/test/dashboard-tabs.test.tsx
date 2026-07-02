import { render, screen } from '@testing-library/react';
import { Tabs } from '@wordpress/ui';
import DashboardTabs, { type DashboardTab } from '../index';

// The strip must live inside a Tabs.Root (normally DashboardLayout's), and
// the dev-mode Tabs validator requires one Panel per rendered Tab, so the
// harness mirrors the layout's conditional panel list.
const renderTabs = ( showPlaylists: boolean ) => {
	const tabs: DashboardTab[] = showPlaylists
		? [ 'overview', 'library', 'playlists', 'settings' ]
		: [ 'overview', 'library', 'settings' ];

	return render(
		<Tabs.Root value="overview">
			<DashboardTabs showPlaylists={ showPlaylists } />
			{ tabs.map( tab => (
				<Tabs.Panel key={ tab } value={ tab } />
			) ) }
		</Tabs.Root>
	);
};

describe( 'DashboardTabs', () => {
	it( 'hides the Playlists tab when showPlaylists is false', () => {
		renderTabs( false );

		expect( screen.getByRole( 'tab', { name: 'Library' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'Playlists' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows the Playlists tab between Library and Settings when showPlaylists is true', () => {
		renderTabs( true );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Library',
			'Playlists',
			'Settings',
		] );
	} );
} );
