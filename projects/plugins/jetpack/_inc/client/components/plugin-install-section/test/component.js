import React from 'react';
import { render, screen } from 'test/test-utils';
import PluginInstallSection from '../index';

describe( 'PluginInstallSection', () => {
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
			pluginsData: {
				items: {
					'test/test.php': {
						active: false,
					},
				},
				requests: {
					isFetchingPluginsData: true,
				},
			},
		},
	};

	it( 'should render loading while isFetching', () => {
		const localTestProps = { ...testProps, isFetchingPluginsData: true };

		render( <PluginInstallSection { ...localTestProps } />, { initialState } );
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();

		initialState.jetpack.pluginsData.requests.isFetchingPluginsData = false;
	} );

	it( 'should render activate prompt if plugin is installed but not active', () => {
		const localTestProps = { ...testProps, aPluginIsInstalled: true };

		render( <PluginInstallSection { ...localTestProps } />, { initialState } );
		expect( screen.getByRole( 'button', { name: 'Activate Test' } ) ).toBeInTheDocument();
	} );

	it( 'should render manage prompt if plugin is installed and active', () => {
		initialState.jetpack.pluginsData.items[ 'test/test.php' ].active = true;

		const localTestProps = { ...testProps, aPluginIsInstalled: true, aPluginIsActive: true };
		render( <PluginInstallSection { ...localTestProps } />, { initialState } );
		expect( screen.getByRole( 'link', { name: 'Manage Test' } ) ).toBeInTheDocument();
	} );

	it( 'should render install prompt if plugin is not installed', () => {
		initialState.jetpack.pluginsData.items = {};

		render( <PluginInstallSection { ...testProps } />, { initialState } );
		expect( screen.getByRole( 'button', { name: 'Install Test' } ) ).toBeInTheDocument();
	} );
} );
