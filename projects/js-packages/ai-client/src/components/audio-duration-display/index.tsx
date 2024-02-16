/*
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
/*
 * Internal dependencies
 */
import { formatTime, getDuration } from './lib/media.js';
/*
 * Types
 */
import type React from 'react';

type AudioDurationDisplayProps = {
	url: string;
	className?: string | null;
};

/**
 * AudioDurationDisplay component.
 *
 * @param {AudioDurationDisplayProps} props - Component props.
 * @returns {React.ReactElement}              Rendered component.
 */
export default function AudioDurationDisplay( {
	url,
	className,
}: AudioDurationDisplayProps ): React.ReactElement {
	const [ duration, setDuration ] = useState( 0 );
	useEffect( () => {
		if ( ! url ) {
			return;
		}

		getDuration( url ).then( setDuration );
	}, [ url ] );

	return <span className={ className }>{ formatTime( duration, { addDecimalPart: false } ) }</span>;
}
