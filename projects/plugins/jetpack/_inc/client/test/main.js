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
