/**
 * Internal dependencies
 */
import { Subscribers } from '../index';

/**
 * The individual observer class.
 */
class Observer {
	/**
	 * The subscribers object.
	 *
	 * @type {Subscribers}
	 */
	subscribers;

	/**
	 * Initialize the object.
	 *
	 * @param {Subscribers} subscribers - The Subscribers object.
	 */
	constructor( subscribers ) {
		this.subscribers = subscribers;
	}

	/**
	 * Notify the subscribers.
	 *
	 * @param {string} eventLabel - The event label.
	 * @param {*} args - The callback argument or multiple args as an object.
	 */
	notify( eventLabel, args ) {
		if ( ! this.subscribers ) {
			return;
		}

		const list = this.subscribers.get( eventLabel );
		list.forEach( callback => {
			if ( {}.toString.call( callback ) === '[object Function]' ) {
				callback( args );
			}
		} );
	}
}

export default Observer;
