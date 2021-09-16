/**
 * Subscribers class.
 */
class Subscribers {
	/**
	 * The subscribers storage.
	 *
	 * @type {object}
	 */
	store = {};

	/**
	 * Add a subscriber (callback) to the list.
	 *
	 * @param {string} eventLabel - Event label.
	 * @param {Function} callback - Callback to call when event is fired.
	 */
	add( eventLabel, callback ) {
		if ( ! this.store.hasOwnProperty( eventLabel ) ) {
			this.store[ eventLabel ] = [];
		}

		this.store[ eventLabel ].push( callback );
	}

	/**
	 * Retrieve all the subscribers (callbacks) for a particular event.
	 *
	 * @param {string} eventLabel - Event label.
	 * @returns {Array} - The list of the event subscribers.
	 */
	get( eventLabel ) {
		return this.store.hasOwnProperty( eventLabel ) ? this.store[ eventLabel ] : [];
	}
}

export default Subscribers;
