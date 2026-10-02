// Temporary Svelte-compatible subscriptions until the React renderer slice.
import { subscribeToFacts } from './store.ts';

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
	invalidate?: () => void,
	imageId?: string
) {
	let value = read();
	let version = revision?.();
	const unsubscribe = subscribeToFacts( () => {
		const next = read();
		const nextVersion = revision?.();
		// Mutable object writes notify; equal primitive values do not.
		const changed =
			( next !== value && ! Object.is( next, value ) ) ||
			( next && typeof next === 'object' && nextVersion !== version );
		version = nextVersion;
		if ( changed ) {
			value = next;
			invalidate?.();
			callback( value );
		}
	}, imageId );
	callback( value );
	return unsubscribe;
}

export function readable< T >(
	read: () => T,
	start?: () => void | ( () => void ),
	revision?: () => number,
	imageId?: string
): Readable< T > {
	let subscribers = 0;
	let stop: void | ( () => void );
	return {
		subscribe( callback, invalidate ) {
			if ( subscribers++ === 0 ) {
				stop = start?.();
			}
			const unsubscribe = observe( read, callback, revision, invalidate, imageId );
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
	revision?: () => number,
	imageId?: string
): Writable< T > {
	return {
		...readable( read, start, revision, imageId ),
		set,
		update: updater => set( updater( read() ) ),
	};
}
