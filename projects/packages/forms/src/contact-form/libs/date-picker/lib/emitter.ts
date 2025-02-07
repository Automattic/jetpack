/**
 * @file Defines simple event emitter behavior.
 */

type TEmitterFn = ( name: string, arg: unknown ) => void;
type TEmitterFns = { [ key: string ]: TEmitterFn };

interface IHandlers {
	[ key: string ]: Array< TEmitterFn >;
}

/**
 * Emitter constructs a new emitter object which has on/off methods.
 *
 * @returns {EventEmitter}
 */
export default function Emitter() {
	var handlers: IHandlers = {};

	function onOne( name: string, handler: TEmitterFn ) {
		( handlers[ name ] = handlers[ name ] || [] ).push( handler );
	}

	function onMany( fns: TEmitterFns ) {
		for ( const name in fns ) {
			onOne( name, fns[ name ] );
		}
	}

	return {
		on: function ( name: string | TEmitterFns, handler?: TEmitterFn ) {
			if ( handler ) {
				onOne( name as string, handler );
			} else {
				onMany( name as TEmitterFns );
			}

			return this;
		},

		emit: function ( name: string, arg?: unknown ) {
			( handlers[ name ] || [] ).forEach( function ( handler ) {
				handler( name, arg );
			} );
		},

		off: function ( name?: string, handler?: TEmitterFn ) {
			if ( ! name ) {
				handlers = {};
			} else if ( ! handler ) {
				handlers[ name ] = [];
			} else {
				handlers[ name ] = ( handlers[ name ] || [] ).filter( function ( h ) {
					return h !== handler;
				} );
			}

			return this;
		},
	};
}
