import { subscribe } from '@wordpress/data';
import { store } from './store.ts';

export type Readable< T > = {
	subscribe: ( callback: ( value: T ) => void, invalidate?: () => void ) => () => void;
};
export type Writable< T > = Readable< T > & {
	set: ( value: T ) => void;
	update: ( updater: ( value: T ) => T ) => void;
};

export function observe< T >(
	read: () => T,
	callback: ( value: T ) => void,
	revision?: () => number,
	invalidate?: () => void
) {
	let value = read();
	let version = revision?.();
	const unsubscribe = subscribe( () => {
		const next = read();
		const nextVersion = revision?.();
		const changed =
			( next !== value && ! Object.is( next, value ) ) ||
			( next && typeof next === 'object' && nextVersion !== version );
		version = nextVersion;
		if ( changed ) {
			value = next;
			invalidate?.();
			callback( value );
		}
	}, store );
	callback( value );
	return unsubscribe;
}

export function readable< T >(
	read: () => T,
	start?: () => void | ( () => void ),
	revision?: () => number
): Readable< T > {
	let subscribers = 0;
	let stop: void | ( () => void );
	return {
		subscribe( callback, invalidate ) {
			if ( subscribers++ === 0 ) {
				stop = start?.();
			}
			const unsubscribe = observe( read, callback, revision, invalidate );
			let active = true;
			return () => {
				if ( ! active ) {
					return;
				}
				active = false;
				unsubscribe();
				if ( --subscribers === 0 ) {
					if ( typeof stop === 'function' ) {
						stop();
					}
				}
			};
		},
	};
}

export function writable< T >(
	read: () => T,
	set: ( value: T ) => void,
	start?: () => void | ( () => void ),
	revision?: () => number
): Writable< T > {
	return { ...readable( read, start, revision ), set, update: updater => set( updater( read() ) ) };
}
