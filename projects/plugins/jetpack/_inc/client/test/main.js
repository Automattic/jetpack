import React from 'react';
import { Provider } from 'react-redux';
import store from 'state/redux-store';
import Main from '../main';

describe( 'Main', () => {
	// @todo: This has apparently never actually tested the rendering of Main, due to the use of enzyme's `shallow()` it only tests that `<Provider store={ store }>` will render without throwing.
	// The `expect( component.find( 'Main' ) ).toBeDefined()` doesn't even test anything, as the empty result set returned by `.find()` is still considered "defined".
	// Actually rendering Main depends on a _ton_ of state. What's really intended here?
	it.skip( 'should render the Main component', () => {
		// eslint-disable-next-line no-undef -- Leave bogus "shallow" call for the TODO above.
		const component = shallow(
			<Provider store={ store }>
				<Main />
			</Provider>
		);
		expect( component.find( 'Main' ) ).toBeDefined();
	} );
} );

describe( 'Admin Menu Functionality', () => {
	// Mock the Jetpack submenu.
	const mockMenuHtml = `
	<li id="toplevel_page_jetpack">
	<ul class="wp-submenu">
		<li class="wp-submenu-head" aria-hidden="true">Jetpack</li>
		<li><a href="https://jetpack.com/redirect/?source=cloud-activity-log-wp-menu">Activity Log</a></li>
		<li><a href="/wp-admin/admin.php?page=jetpack#/settings">Settings</a></li>
		<li class="current"><a href="/wp-admin/admin.php?page=jetpack#/dashboard">Dashboard</a></li>
	</ul>
	</li>
	`;

	beforeEach( () => {
		document.body.innerHTML = mockMenuHtml;
	} );

	/**
	 * Utility function to simulate a click on a menu item
	 * @param {Element} menuItem - The menu item to click
	 */
	function simulateClick( menuItem ) {
		const menuItems = document.querySelectorAll( '.wp-submenu li:not(.wp-submenu-head)' );
		menuItems.forEach( item => item.classList.remove( 'current' ) );
		menuItem.parentElement.classList.add( 'current' );
	}

	it( 'should apply the "current" class to the clicked menu item', () => {
		const myMenu = document.querySelector( '#toplevel_page_jetpack' );
		const subMenu = myMenu.querySelector( '.wp-submenu' );

		const dashboardItem = subMenu.querySelector(
			'a[href="/wp-admin/admin.php?page=jetpack#/dashboard"]'
		);
		const settingsItem = subMenu.querySelector(
			'a[href="/wp-admin/admin.php?page=jetpack#/settings"]'
		);

		// For test purposes we'll give 'Dashboard' the 'current' class
		expect( dashboardItem.parentElement ).toHaveClass( 'current' );
		expect( settingsItem.parentElement ).not.toHaveClass( 'current' );

		// Simulate clicking on the 'Settings' menu item
		simulateClick( settingsItem );

		// After clicking, 'Settings' should have the 'current' class and 'Dashboard' should not
		expect( settingsItem.parentElement ).toHaveClass( 'current' );
		expect( dashboardItem.parentElement ).not.toHaveClass( 'current' );
	} );
} );
