( () => {
	function requestJitm() {
		if ( window._currentSiteId ) {
			return wp.apiFetch( {
				apiNamespace: 'rest/v1.1',
				global: true,
				path:
					'/jetpack-blogs/' +
					window._currentSiteId +
					'/rest-api?path=/jetpack/v4/jitm&query={"message_path":"calypso:sites:sidebar_notice"}',
				method: 'GET',
			} );
		}

		return wp.apiFetch( {
			method: 'GET',
			url: window.wpApiSettings.root + 'jetpack/v4/jitm?message_path=calypso:sites:sidebar_notice',
		} );
	}

	requestJitm().then( response => {
		let data;
		if ( response.data ) {
			data = response.data;
		} else {
			data = response;
		}

		if ( data.length ) {
			const upsell = data[ 0 ];
			let menuElement = document.createElement( 'li' );
			menuElement.className = 'toplevel_page_site-notices';
			menuElement.id = 'toplevel_page_site-notices';

			let link = document.createElement( 'a' );
			let href = upsell.CTA.link;
			if ( href.indexOf( '/' ) === 0 ) {
				href = 'https://wordpress.com' + href;
			}
			link.href = href;
			link.className =
				'wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices';

			let arrow = document.createElement( 'div' );
			arrow.className = 'wp-menu-arrow';
			let image = document.createElement( 'div' );
			image.className = 'wp-menu-image dashicons-before dashicons-admin-generic';
			let name = document.createElement( 'div' );
			name.className = 'wp-menu-name';
			let banner = document.createElement( 'div' );
			banner.className = 'upsell_banner';
			let bannerInfo = document.createElement( 'div' );
			bannerInfo.className = 'banner__info';
			let bannerTitle = document.createElement( 'div' );
			bannerTitle.className = 'banner__title';
			bannerTitle.textContent = upsell.content.message;
			let bannerAction = document.createElement( 'div' );
			bannerAction.className = 'banner__action';
			let bannerButton = document.createElement( 'button' );
			bannerButton.className = 'button';
			bannerButton.type = 'button';
			bannerButton.textContent = upsell.CTA.message;

			bannerAction.append( bannerButton );
			bannerInfo.append( bannerTitle );
			banner.append( bannerInfo, bannerAction );
			name.append( banner );
			link.append( arrow, image, name );
			menuElement.append( link );

			if ( upsell.is_dismissible ) {
				let dismissButton = document.createElement( 'span' );
				dismissButton.setAttribute( 'data-feature_class', upsell.feature_class );
				dismissButton.setAttribute( 'data-feature_id', upsell.id );
				dismissButton.setAttribute(
					'class',
					'dashicons dashicons-after dashicons-no-alt dismissible-card__close-icon'
				);
				banner.append( dismissButton );
			}

			document.getElementById( 'toplevel_page_site_card' ).after( menuElement );
		}
	} );
} )();
