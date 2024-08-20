import { useBlockProps } from '@wordpress/block-editor';
import { Button, DateTimePicker, Dropdown, Placeholder } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { dateI18n, __experimentalGetSettings } from '@wordpress/date'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import moment from 'moment';
import EventCountDown from './event-countdown';
import { EventCountdownIcon } from './icon';

const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

/**
 * Assigns timezone to a date without altering it
 * @param {string} date   - a date in YYYY-MM-DDTHH:mm:ss format
 * @param {number} offset - the offset in hours
 * @param {string} format - the format of the date
 * @return {object} a moment instance
 */
function assignTimezone( date, offset, format = TIMEZONELESS_FORMAT ) {
	// passing the `true` flag to `utcOffset` keeps the date unaltered, only adds a tz
	return moment( date, format ).utcOffset( offset * 60, true );
}

const EventCountDownBlockEdit = ( { attributes, setAttributes, isSelected } ) => {
	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-event-countdown',
	} );

	const instanceId = useInstanceId( EventCountDownBlockEdit );

	const settings = __experimentalGetSettings();

	let label = __( 'Choose Date', 'jetpack-mu-wpcom' );
	let eventDate;

	if ( attributes.eventTimestamp ) {
		label = dateI18n(
			settings.formats.datetimeAbbreviated,
			// eventTimestamp is UNIX (in seconds), Date expect milliseconds
			new Date( attributes.eventTimestamp * 1000 )
		);

		// the DateTimePicker requires the date to be in this format
		// we offset the date by the site timezone settings to counteract the Datepicker automatic adjustment to the client-side timezone
		eventDate = moment( attributes.eventTimestamp * 1000 )
			.utcOffset( settings.timezone.offset * 60 )
			.format( TIMEZONELESS_FORMAT );
	} else if ( attributes.eventDate ) {
		// backwards compatibility
		const siteTimeZoneAdjustedTime = assignTimezone(
			attributes.eventDate,
			Number.parseFloat( settings.timezone.offset ) // offset can be a string if a manual timezone is selected
		);

		label = dateI18n( settings.formats.datetimeAbbreviated, siteTimeZoneAdjustedTime );
		eventDate = attributes.eventDate;
	}

	return (
		<div { ...blockProps }>
			{ isSelected && (
				<Placeholder
					label={ __( 'Event Countdown', 'jetpack-mu-wpcom' ) }
					instructions={ __(
						'Count down to an event. Set a title and pick a time and date.',
						'jetpack-mu-wpcom'
					) }
					icon={ <EventCountdownIcon /> }
				>
					<div>
						<label htmlFor={ `event-countdown-title-${ instanceId }` }>
							<strong>{ __( 'Title:', 'jetpack-mu-wpcom' ) }</strong>
						</label>
						<input
							type="text"
							id={ `event-countdown-title-${ instanceId }` }
							value={ attributes.eventTitle || '' }
							className={ clsx( 'components-placeholder__input', 'event-countdown__event-title' ) }
							aria-label={ __( 'Event Title', 'jetpack-mu-wpcom' ) }
							placeholder={ __( 'Event Title', 'jetpack-mu-wpcom' ) }
							onChange={ evt => setAttributes( { eventTitle: evt.target.value } ) }
						/>
					</div>
					<div>
						<label htmlFor={ `event-countdown-date-${ instanceId }` }>
							<strong>{ __( 'Date:', 'jetpack-mu-wpcom' ) }</strong>
						</label>
						<Dropdown
							position="bottom left"
							renderToggle={ ( { onToggle, isOpen } ) => (
								<Button
									onClick={ onToggle }
									aria-expanded={ isOpen }
									aria-live="polite"
									isSecondary
									id={ `event-countdown-date-${ instanceId }` }
								>
									{ label }
								</Button>
							) }
							renderContent={ () => (
								<DateTimePicker
									key="event-countdown-picker"
									onChange={ date =>
										setAttributes( {
											eventTimestamp: assignTimezone( date, settings.timezone.offset ).unix(),
										} )
									}
									currentDate={ eventDate }
								/>
							) }
						/>
					</div>
				</Placeholder>
			) }
			{ ! isSelected && (
				<EventCountDown
					eventTitle={ attributes.eventTitle }
					eventTimestamp={ attributes.eventTimestamp }
					eventDate={ attributes.eventDate }
					isPreviewing
				/>
			) }
		</div>
	);
};

export default EventCountDownBlockEdit;
