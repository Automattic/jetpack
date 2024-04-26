document.addEventListener( 'DOMContentLoaded', () => {
	const body = document.querySelector( 'body' ),
		toggleSSO = document.querySelector( '.jetpack-sso-toggle' ),
		userLogin = document.getElementById( 'user_login' ),
		userPassword = document.getElementById( 'user_pass' ),
		ssoWrap = document.getElementById( 'jetpack-sso-wrap' ),
		loginForm = document.getElementById( 'loginform' ),
		overflow = document.createElement( 'div' );

	overflow.className = 'jetpack-sso-clear';

	loginForm.appendChild( overflow );
	overflow.appendChild( document.querySelector( 'p.forgetmenot' ) );
	overflow.appendChild( document.querySelector( 'p.submit' ) );

	loginForm.appendChild( ssoWrap );
	body.classList.add( 'jetpack-sso-repositioned' );

	toggleSSO.addEventListener( 'click', e => {
		e.preventDefault();
		body.classList.toggle( 'jetpack-sso-form-display' );
		if ( ! body.classList.contains( 'jetpack-sso-form-display' ) ) {
			userLogin.focus();
			userPassword.disabled = false;
		}
	} );
} );
