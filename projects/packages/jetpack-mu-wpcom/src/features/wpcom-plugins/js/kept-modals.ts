/**
 * Closed modals kept for reopening, most recent last, up to a limit.
 */
export class KeptModals< T > {
	private readonly modals = new Map< string, T >();

	private readonly limit: number;

	/**
	 * Keeps up to `limit` modals.
	 *
	 * @param limit - How many to keep before dropping the oldest.
	 */
	constructor( limit: number ) {
		this.limit = limit;
	}

	/**
	 * Keeps a closed modal.
	 *
	 * @param key   - What reopens it.
	 * @param modal - The modal.
	 * @return The modals dropped to make room, oldest first, for the caller to discard.
	 */
	keep( key: string, modal: T ): T[] {
		const dropped: T[] = [];

		// Re-set so a modal kept again counts as the most recent.
		this.modals.delete( key );
		this.modals.set( key, modal );

		for ( const [ oldest, kept ] of this.modals ) {
			if ( this.modals.size <= this.limit ) {
				break;
			}
			this.modals.delete( oldest );
			dropped.push( kept );
		}

		return dropped;
	}

	/**
	 * Takes a kept modal back to show it. It is kept again when it next closes.
	 *
	 * @param key - What reopens it.
	 * @return The modal, or undefined when it was never kept or has been dropped.
	 */
	take( key: string ): T | undefined {
		const modal = this.modals.get( key );
		this.modals.delete( key );

		return modal;
	}
}
