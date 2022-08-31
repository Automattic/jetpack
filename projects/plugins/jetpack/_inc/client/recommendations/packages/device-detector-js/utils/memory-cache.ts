interface MemoryCacheBucket< Value > {
	[ key: string ]: Value;
}

export const memoryCache = < Value >() => {
	const memoryCacheBucket: MemoryCacheBucket< Value > = {};

	const set = ( key: string, value: Value ) => {
		memoryCacheBucket[ key ] = value;
	};

	const get = ( key: string ): Value | undefined => {
		if ( memoryCacheBucket.hasOwnProperty( key ) ) {
			return memoryCacheBucket[ key ] as Value;
		}
	};

	return {
		set,
		get,
	};
};
