/*
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
/*
 * Internal dependencies
 */
import { formatTime, getDuration } from './lib/media';
/*
 * Types
 */
import type React from 'react';

type AudioDurationDisplayProps = {
	url: string;
};

/**
 * AudioDurationDisplay component.
 *
 * @param {AudioDurationDisplayProps} props - Component props.
 * @returns {React.ReactElement}              Rendered component.
 */
export default function AudioDurationDisplay( {
	url,
}: AudioDurationDisplayProps ): React.ReactElement {
	const [ duration, setDuration ] = useState( 0 );
	useEffect( () => {
		if ( ! url ) {
			return;
		}

		getDuration( url ).then( setDuration );
	}, [ url ] );

	return <span>{ formatTime( duration, { addDecimalPart: false } ) }</span>;
}
