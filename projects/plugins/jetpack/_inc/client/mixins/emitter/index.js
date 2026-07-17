import { EventEmitter } from 'events';

/**
 * Adds EventEmitter methods to a prototype.
 *
 * @param {object} prototype - Prototype to extend.
 */
export default function ( prototype ) {
	Object.assign( prototype, EventEmitter.prototype );
	prototype.emitChange = function () {
		this.emit( 'change' );
	};
	prototype.off = prototype.removeListener;
}
