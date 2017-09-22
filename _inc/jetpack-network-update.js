jQuery( document ).ready( function( $ ) {
	/**
	 * Update the site
	 * @param site
	 */
	var count = 0;
	$shell = $('#jetpack-network-update-shell')
	function update_site( site ) {
		count++;
		var next_site = jetpackUpdateNetwork.sites[ count ];
		var data = { action: 'jetpack-network-update' };
		if ( site.skip_update ) {
			add_site( site );
			if ( next_site ) {
				update_site( next_site );
			} else {
				maybe_redirect();
			}
		} else {
			// update the site
			$.post( site.admin_url, data ).done( function( response ) {
				add_site( site );
				if ( next_site ) {
					update_site( next_site )
				} else {
					maybe_redirect();
				}
			});
		}
	}

	function maybe_redirect() {
		if ( jetpackUpdateNetwork.sites.length == jetpackUpdateNetwork.count ) {
			window.location.replace( jetpackUpdateNetwork.redirect_to );
		} else {
			$shell.html( '<div class="updated"><p>'+jetpackUpdateNetwork.done + '</p></div>' );
		}
	}

	function add_site( site ) {
		$shell.append( '<div class="updated"><p><span>'+ jetpackUpdateNetwork.success +'</span>' + site.title + '<span>'+ site.url + '</span></p></div>' );
	}

	// lets start this off
	if ( jetpackUpdateNetwork.sites ) {
		update_site( jetpackUpdateNetwork.sites[ count ] );
	}
} );

