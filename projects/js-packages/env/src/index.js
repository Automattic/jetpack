const env = {};

export const setEnv = ( key, value ) => {
	if ( env.hasOwnProperty( key ) ) {
		throw 'Env variable "' + key + '" is already set.';
	}
	env[ key ] = value;
};

export const getEnv = key => {
	if ( ! env.hasOwnProperty( key ) ) {
		throw 'This app requires the "' + key + '" env variable to be defined.';
	}
	return env[ key ];
};
