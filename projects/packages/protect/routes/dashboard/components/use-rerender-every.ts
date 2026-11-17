import { useEffect, useState } from '@wordpress/element';

/**
 * Re-render on an interval, so relative times like "a few seconds ago" don't go stale.
 *
 * @param ms      - How often to re-render.
 * @param enabled - Whether there is anything to keep current.
 */
export default function useRerenderEvery( ms: number, enabled: boolean ): void {
	const [ , setTick ] = useState( 0 );
	useEffect( () => {
		if ( ! enabled ) {
			return;
		}
		const timer = setInterval( () => setTick( tick => tick + 1 ), ms );
		return () => clearInterval( timer );
	}, [ ms, enabled ] );
}
