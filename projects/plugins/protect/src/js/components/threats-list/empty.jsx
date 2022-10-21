import { H3, Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import styles from './styles.module.scss';

const ProtectCheck = () => (
	<svg width="80" height="96" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M40 0.00634766L80 17.7891V44.2985C80 66.8965 65.1605 88.2927 44.2352 95.0425C41.4856 95.9295 38.5144 95.9295 35.7648 95.0425C14.8395 88.2927 0 66.8965 0 44.2985V17.7891L40 0.00634766Z"
			fill="#069E08"
		/>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M60.9 33.6909L35.375 67.9124L19.2047 55.9263L22.7848 51.1264L34.1403 59.5436L56.0851 30.122L60.9 33.6909Z"
			fill="white"
		/>
	</svg>
);

/**
 * Time Since
 *
 * @param {string} date - The past date to compare to the current date.
 * @returns {string} - A description of the amount of time between a date and now, i.e. "5 minutes ago".
 */
const timeSince = date => {
	const now = new Date();
	const offset = now.getTimezoneOffset() * 60000;

	const seconds = Math.floor( ( new Date( now.getTime() + offset ).getTime() - date ) / 1000 );

	let interval = seconds / 31536000; // 364 days
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of years i.e. "5 years ago".
			__( '%s years ago', 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 2592000; // 30 days
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of months i.e. "5 months ago".
			__( '%s months ago', 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 86400; // 1 day
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of days i.e. "5 days ago".
			__( '%s days ago', 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 3600; // 1 hour
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of hours i.e. "5 hours ago".
			__( '%s hours ago', 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 60; // 1 minute
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of minutes i.e. "5 minutes ago".
			__( '%s minutes ago', 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	return __( 'a few seconds ago', 'jetpack-protect' );
};

const EmptyList = () => {
	const { lastChecked } = useProtectData();

	const timeSinceLastScan = useMemo( () => {
		return lastChecked ? timeSince( Date.parse( lastChecked ) ) : null;
	}, [ lastChecked ] );

	return (
		<div className={ styles.empty }>
			<ProtectCheck />
			<H3 weight="bold" mt={ 8 }>
				{ __( "Don't worry about a thing", 'jetpack-protect' ) }
			</H3>
			<Text>
				{ createInterpolateElement(
					sprintf(
						// translators: placeholder is the amount of time since the last scan, i.e. "5 minutes ago".
						__(
							'The last Protect scan ran <strong>%s</strong> and everything looked great.',
							'jetpack-protect'
						),
						timeSinceLastScan
					),
					{
						strong: <strong />,
					}
				) }
			</Text>
		</div>
	);
};

export default EmptyList;
