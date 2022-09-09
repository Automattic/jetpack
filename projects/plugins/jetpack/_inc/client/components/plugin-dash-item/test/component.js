import React from 'react';
import { render, screen } from 'test/test-utils';
import { PluginDashItem } from '../index';

describe( 'PluginDashItem', () => {
	const testProps = {
		pluginName: 'Test',
		pluginFiles: [ 'test/test.php' ],
		pluginSlug: 'test',
		pluginLink: '/',
		installOrActivatePrompt: <p>{ 'Install the test plugin.' }</p>,
		isFetchingPluginsData: false,
		aPluginIsActive: false,
		aPluginIsInstalled: false,
	};
	const initialState = {
		jetpack: {
			initialState: {
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
					},
				},
			},
			connection: {
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
		},
	};

	it( 'should render loading while isFetching', () => {
		const localTestProps = { ...testProps, isFetchingPluginsData: true };
		render( <PluginDashItem { ...localTestProps } />, { initialState } );
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
	} );

	it( 'should render install prompt if plugin is not installed', () => {
		render( <PluginDashItem { ...testProps } />, { initialState } );
		expect( screen.getByRole( 'button', { name: 'Install Test' } ) ).toBeInTheDocument();
	} );

	it( 'should render activate prompt if plugin is installed but not active', () => {
		const localTestProps = { ...testProps, aPluginIsInstalled: true };
		render( <PluginDashItem { ...localTestProps } />, { initialState } );
		expect( screen.getByRole( 'button', { name: 'Activate Test' } ) ).toBeInTheDocument();
	} );

	it( 'should render manage prompt if plugin is installed and active', () => {
		const localTestProps = { ...testProps, aPluginIsInstalled: true, aPluginIsActive: true };
		render( <PluginDashItem { ...localTestProps } />, { initialState } );
		expect( screen.getByRole( 'link', { name: 'Manage Test' } ) ).toBeInTheDocument();
	} );
} );
