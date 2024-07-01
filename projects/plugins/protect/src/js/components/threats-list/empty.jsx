import { Button, H3, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __, _n } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import OnboardingPopover from '../onboarding-popover';
import ProtectCheck from '../protect-check-icon';
import styles from './styles.module.scss';

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
			_n( '%s year ago', '%s years ago', Math.floor( interval ), 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 2592000; // 30 days
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of months i.e. "5 months ago".
			_n( '%s month ago', '%s months ago', Math.floor( interval ), 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 86400; // 1 day
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of days i.e. "5 days ago".
			_n( '%s day ago', '%s days ago', Math.floor( interval ), 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 3600; // 1 hour
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of hours i.e. "5 hours ago".
			_n( '%s hour ago', '%s hours ago', Math.floor( interval ), 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 60; // 1 minute
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of minutes i.e. "5 minutes ago".
			_n( '%s minute ago', '%s minutes ago', Math.floor( interval ), 'jetpack-protect' ),
			Math.floor( interval )
		);
	}

	return __( 'a few seconds ago', 'jetpack-protect' );
};

const EmptyList = () => {
	const { lastChecked, hasRequiredPlan } = useProtectData();
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing() );
	const { scan } = useDispatch( STORE_ID );
	const [ dailyAndManualScansPopoverAnchor, setDailyAndManualScansPopoverAnchor ] =
		useState( null );

	const timeSinceLastScan = useMemo( () => {
		return lastChecked ? timeSince( Date.parse( lastChecked ) ) : null;
	}, [ lastChecked ] );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

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
			{ hasRequiredPlan && (
				<>
					<Button
						ref={ setDailyAndManualScansPopoverAnchor }
						variant="secondary"
						className={ styles[ 'summary__scan-button' ] }
						isLoading={ scanIsEnqueuing }
						onClick={ handleScanClick() }
					>
						{ __( 'Scan now', 'jetpack-protect' ) }
					</Button>
					<OnboardingPopover
						id="paid-daily-and-manual-scans"
						position="middle left"
						anchor={ dailyAndManualScansPopoverAnchor }
					/>
				</>
			) }
		</div>
	);
};

export default EmptyList;
