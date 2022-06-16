import JetpackBanner from 'components/jetpack-banner';
import { shallow } from 'enzyme';
import React from 'react';
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

	it( 'should render loading while isFetching', () => {
		const localTestProps = { ...testProps, isFetchingPluginsData: true };
		const wrapper = shallow( <PluginDashItem { ...localTestProps } /> );
		const content = wrapper.find( '.plugin-dash-item__content>p' );

		expect( content ).toHaveLength( 1 );
		expect( content.text() ).toBe( 'Loading…' );
	} );

	it( 'should render install prompt if plugin is not installed', () => {
		const wrapper = shallow( <PluginDashItem { ...testProps } /> );
		const content = wrapper.find( JetpackBanner );

		expect( content ).toHaveLength( 1 );
		expect( content.prop( 'callToAction' ) ).toBe( 'Install Test' );
	} );

	it( 'should render activate prompt if plugin is installed but not active', () => {
		const localTestProps = { ...testProps, aPluginIsInstalled: true };
		const wrapper = shallow( <PluginDashItem { ...localTestProps } /> );
		const content = wrapper.find( JetpackBanner );

		expect( content ).toHaveLength( 1 );
		expect( content.prop( 'callToAction' ) ).toBe( 'Activate Test' );
	} );

	it( 'should render manage prompt if plugin is installed and active', () => {
		const localTestProps = { ...testProps, aPluginIsInstalled: true, aPluginIsActive: true };
		const wrapper = shallow( <PluginDashItem { ...localTestProps } /> );
		const content = wrapper.find( JetpackBanner );

		expect( content ).toHaveLength( 1 );
		expect( content.prop( 'callToAction' ) ).toBe( 'Manage Test' );
	} );
} );
