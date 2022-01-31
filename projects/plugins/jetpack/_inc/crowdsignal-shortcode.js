( function ( d, c, j ) {
	var crowdsignal_shortcode_options;
	if (
		crowdsignal_shortcode_options &&
		crowdsignal_shortcode_options.script_url &&
		! d.getElementById( j )
	) {
		var pd = d.createElement( c ),
			s;
		pd.id = j;
		pd.async = true;
		pd.src = crowdsignal_shortcode_options.script_url;
		s = d.getElementsByTagName( c )[ 0 ];
		s.parentNode.insertBefore( pd, s );
	} else if ( typeof jQuery !== 'undefined' ) {
		jQuery( d.body ).trigger( 'pd-script-load' );
	}
} )( document, 'script', 'pd-polldaddy-loader' );
