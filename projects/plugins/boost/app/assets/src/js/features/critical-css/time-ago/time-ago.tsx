// This Component shows a span with the given time (Date) as a relative time in
// the past. Mouseover to show the exact time.
import describeTimeAgo from '$lib/utils/describe-time-ago';
import { useEffect, useState } from 'react';

const TimeAgo = ( { time } ) => {
	const [ label, setLabel ] = useState( describeTimeAgo( time ) );

	useEffect( () => {
		// Update label every 10 seconds.
		const interval = setInterval( () => {
			setLabel( describeTimeAgo( time ) );
		}, 10 * 1000 );

		return () => clearInterval( interval );
	}, [ time ] );

	return (
		<span title={ time.toLocaleString() } className="time-ago">
			{ label }
		</span>
	);
};

export default TimeAgo;
