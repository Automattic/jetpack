window.jetpack_registry = {};

export const registrySet = ( key, value ) => {
	if ( window.jetpack_registry.hasOwnProperty( key ) && window.jetpack_registry[ key ] !== value ) {
		throw 'Jetpack Registry entry "' + key + '" is already set.';
	}
	window.jetpack_registry[ key ] = value;
};

export const registryGet = key => {
	if ( ! window.jetpack_registry.hasOwnProperty( key ) ) {
		throw 'This app requires the "' + key + '" Jetpack Registry entry to be defined.';
	}
	return window.jetpack_registry[ key ];
};

export const registryHas = key => {
	return window.jetpack_registry.hasOwnProperty( key );
};
