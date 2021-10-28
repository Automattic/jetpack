window.jetpack_env = {};

export const setEnv = ( key, value ) => {
	if ( window.jetpack_env.hasOwnProperty( key ) && window.jetpack_env[ key ] !== value ) {
		throw 'Jetpack Env variable "' + key + '" is already set.';
	}
	window.jetpack_env[ key ] = value;
};

export const getEnv = key => {
	if ( ! window.jetpack_env.hasOwnProperty( key ) ) {
		throw (
			'This app requires the "' +
			key +
			'" Jetpack Env variable to be defined. See __link_to_docs__.'
		);
	}
	return window.jetpack_env[ key ];
};
