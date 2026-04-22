/* eslint-disable react/jsx-no-bind, jsdoc/require-returns */

import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { useMemo } from 'react';
import { useFormattedTime } from '../../data/use-formatted-time';
import styles from './style.module.scss';
import type { DateRange } from '../../data/use-date-range';
import type { FC } from 'react';

interface DateRangePickerProps {
	dateRange: DateRange;
	onChange: ( next: DateRange ) => void;
}

const msPerDay = 24 * 60 * 60 * 1000;

const presetDays: Array< { id: string; days: number; label: string } > = [
	{ id: 'last-7-days', days: 7, label: __( 'Last 7 days', 'jetpack-backup-pkg' ) },
	{ id: 'last-14-days', days: 14, label: __( 'Last 14 days', 'jetpack-backup-pkg' ) },
	{ id: 'last-30-days', days: 30, label: __( 'Last 30 days', 'jetpack-backup-pkg' ) },
	{ id: 'last-90-days', days: 90, label: __( 'Last 90 days', 'jetpack-backup-pkg' ) },
];

const buildRange = ( days: number ): DateRange => {
	const end = new Date();
	const start = new Date( end.getTime() - ( days - 1 ) * msPerDay );
	return { start, end };
};

/**
 * Render the currently-selected date range as a short human label.
 *
 * @param props           - Component props.
 * @param props.dateRange - Range to render.
 */
const RangeLabel: FC< { dateRange: DateRange } > = ( { dateRange } ) => {
	const startLabel = useFormattedTime( dateRange.start.toISOString(), { dateStyle: 'medium' } );
	const endLabel = useFormattedTime( dateRange.end.toISOString(), { dateStyle: 'medium' } );
	return (
		<>
			{ sprintf(
				/* translators: 1: start date, e.g. "Mar 24, 2026"; 2: end date, e.g. "Apr 22, 2026". */
				__( '%1$s to %2$s', 'jetpack-backup-pkg' ),
				startLabel,
				endLabel
			) }
		</>
	);
};

/**
 * Preset-based date range picker for the Backup overview header. Each
 * preset replaces the current range; the component is deliberately
 * minimal for the first port — free date selection comes later.
 *
 * @param props           - Component props.
 * @param props.dateRange - Current date range.
 * @param props.onChange  - Called with the new range when the user picks a preset.
 */
const DateRangePicker: FC< DateRangePickerProps > = ( { dateRange, onChange } ) => {
	const dayCount = useMemo( () => {
		const diff = dateRange.end.getTime() - dateRange.start.getTime();
		return Math.round( diff / msPerDay ) + 1;
	}, [ dateRange ] );

	return (
		<Dropdown
			className="jp-backup-date-range-picker"
			popoverProps={ { placement: 'bottom-end' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					className={ styles.dateRangeToggle }
					variant="secondary"
					icon={ calendar }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					<RangeLabel dateRange={ dateRange } />
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<MenuGroup>
					{ presetDays.map( preset => (
						<MenuItem
							key={ preset.id }
							onClick={ () => {
								onChange( buildRange( preset.days ) );
								onClose();
							} }
							isSelected={ preset.days === dayCount }
						>
							{ preset.label }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		/>
	);
};

export default DateRangePicker;
