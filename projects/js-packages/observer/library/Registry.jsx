/**
 * Internal dependencies
 */
import { Observer } from '../index';

/**
 * The observer registry.
 */
class Registry {
	/**
	 * The observers.
	 *
	 * @type {Array}
	 */
	static observers = [];

	/**
	 * Add an observer object to the registry.
	 *
	 * @param {Observer} observer - Observer to store in the registry.
	 */
	static add( observer ) {
		Registry.observers.push( observer );
	}

	/**
	 * Fire event over all the observers in the registry.
	 *
	 * @param {string} event - Event label to fire.
	 * @param {*} args - The callback argument or multiple args as an object.
	 */
	static fireEvent( event, args ) {
		Registry.observers.forEach( observer => observer.notify( event, args ) );
	}
}

export default Registry;
