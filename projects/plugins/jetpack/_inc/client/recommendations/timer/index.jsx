import { __, sprintf } from '@wordpress/i18n';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const Timer = ( { label, timeClassName, expiryDate } ) => {
	const date = useMemo( () => new Date( expiryDate ), [ expiryDate ] );
	const [ duration, setDuration ] = useState( date - Date.now() );
	const intervalRef = useRef();

	const tick = useCallback( () => {
		setDuration( date - Date.now() );
	}, [ date, setDuration ] );

	const format = useCallback( ts => {
		const d = ts / 1000;
		const days = Math.floor( d / ( 3600 * 24 ) );
		const hours = Math.floor( ( d - days * 3600 * 24 ) / 3600 );
		const minutes = Math.floor( ( d - days * 3600 * 24 - hours * 3600 ) / 60 );
		const seconds = Math.floor( d - days * 3600 * 24 - hours * 3600 - minutes * 60 );
		const parts = [];

		if ( days > 0 ) {
			// translators: %d is the number of days, d an abbreviation for days (e.g. 7d). Only translate the latter.
			parts.push( sprintf( __( '%dd', 'jetpack' ), days ) );
		}

		if ( days > 0 || hours > 0 ) {
			// translators: %d is the number of hours, h an abbreviation for hours (e.g. 23h). Only translate the latter.
			parts.push( sprintf( __( '%dh', 'jetpack' ), hours ) );
		}

		if ( days > 0 || hours > 0 || minutes > 0 ) {
			// translators: %d is the number of minutes, m an abbreviation for minutes (e.g. 59m). Only translate the latter.
			parts.push( sprintf( __( '%dm', 'jetpack' ), minutes ) );
		}

		// translators: %d is the number of seconds, s an abbreviation for seconds (e.g. 59s). Only translate the latter.
		parts.push( sprintf( __( '%ds', 'jetpack' ), seconds ) );

		return parts.join( ' ' );
	}, [] );

	useEffect( () => {
		const id = setInterval( tick, 500 );

		intervalRef.current = id;

		return () => {
			clearInterval( intervalRef.current );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return duration > 0 ? (
		<>
			{ label }
			<span className={ timeClassName }>{ format( duration ) }</span>
		</>
	) : (
		__( 'Discount offer has ended', 'jetpack' )
	);
};

export default Timer;
