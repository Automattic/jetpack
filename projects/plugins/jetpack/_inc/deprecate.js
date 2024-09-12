addEventListener( 'DOMContentLoaded', () => {
	const notices = document.getElementsByClassName( 'jetpack-deprecate-dismissible' );
	for ( let i = 0; i < notices.length; ++i ) {
		if ( ! notices[ i ].hasAttribute( 'id' ) ) {
			continue;
		}

		notices[ i ].addEventListener( 'click', event => {
			if ( event.target.classList.contains( 'notice-dismiss' ) ) {
				document.cookie =
					'jetpack_deprecate_dismissed[' +
					notices[ i ].getAttribute( 'id' ) +
					']=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=None;';
			}
		} );
	}
} );
