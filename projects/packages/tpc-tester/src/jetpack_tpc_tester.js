window.jetpack_3rdpc_test_verify = function () {
	var testElement = document.createElement( 'script' );
	testElement.setAttribute( 'src', jetpack_tpc_tester_client.test_url );
	document.head.appendChild( testElement );
};

window.jetpack_3rdpc_test_supported = function () {
	window.jetpack_3rdpc_test_set_cookie( jetpack_tpc_tester_client.supported_value );
};

window.jetpack_3rdpc_test_unsupported = function () {
	window.jetpack_3rdpc_test_set_cookie( jetpack_tpc_tester_client.unsupported_value );
};

window.jetpack_3rdpc_test_set_cookie = function ( value ) {
	console.log( 'Test result: ' + value );
	var expires = '';
	var date = new Date();
	date.setTime( date.getTime() + 3600 );
	expires = '; expires=' + date.toUTCString();
	// TODO: use window.wpCookies ?
	document.cookie =
		jetpack_tpc_tester_client.cookie_name +
		'=' +
		value +
		expires +
		'; Max-Age=600; SameSite=Strict; path=/;';
};
