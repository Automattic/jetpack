import * as React from 'react';
import { useEffect, useState } from 'react';

// Duration of each dot appearing, in ms.
const DOT_INTERVAL = 200;
// Pause duration after all three dots are shown, in ms.
const PAUSE_DURATION = 1000;

const DELAYS = [ DOT_INTERVAL, DOT_INTERVAL, DOT_INTERVAL, PAUSE_DURATION ];
const DOT_STRINGS = [ '', '.', '..', '...' ];

/**
 * Renders an animated ellipsis that types out one period at a time,
 * pauses, then resets.
 *
 * @return {React.ReactElement} Animated ellipsis span.
 */
export default function AnimatedEllipsis() {
	const [ step, setStep ] = useState( 0 );

	useEffect( () => {
		const timeout = setTimeout( () => {
			setStep( s => ( s + 1 ) % 4 );
		}, DELAYS[ step ] );
		return () => clearTimeout( timeout );
	}, [ step ] );

	return (
		<span aria-hidden="true" style={ { display: 'inline-block', minWidth: '1.5ch' } }>
			{ DOT_STRINGS[ step ] }
		</span>
	);
}
