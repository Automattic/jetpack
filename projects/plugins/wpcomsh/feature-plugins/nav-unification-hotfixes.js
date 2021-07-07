/* global ajaxurl, jpAdminMenu */

( function () {
	function init() {
		// Hotfix of https://github.com/Automattic/jetpack/pull/20228.
		var switcher = document.querySelector( '#dashboard-switcher .dashboard-switcher-button' );

		if ( switcher ) {
			switcher.addEventListener( 'click', setDefaultViewAsPreferred );
		}
	}

	function setDefaultViewAsPreferred() {
		var xhr = new XMLHttpRequest();
		var url = ajaxurl +
			'?action=set_preferred_view&screen=' +
			jpAdminMenu.screen +
			'&preferred-view=default';
		xhr.open( 'GET', url, true );
		xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		xhr.withCredentials = true;
		xhr.send();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
