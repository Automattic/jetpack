import { __, _x } from '@wordpress/i18n';

import './event-countdown.scss';

const EventCountdown = ( { eventTitle, eventTimestamp, eventDate, isPreviewing } ) => {
	// Expected values in save.
	let days = '&nbsp;';
	let hours = '&nbsp;';
	let mins = '&nbsp;';
	let secs = '&nbsp;';

	if ( isPreviewing ) {
		// Zero out.
		days = hours = mins = secs = 0;
		let eventTime;
		if ( eventTimestamp ) {
			eventTime = eventTimestamp * 1000;
		} else {
			// backwards compatibility
			eventTime = new Date( eventDate ).getTime();
		}
		const now = Date.now();
		const diff = eventTime - now;

		if ( diff > 0 ) {
			// Convert diff to seconds.
			let rem = Math.round( diff / 1000 );

			days = Math.floor( rem / ( 24 * 60 * 60 ) );
			rem = rem - days * 24 * 60 * 60;

			hours = Math.floor( rem / ( 60 * 60 ) );
			rem = rem - hours * 60 * 60;

			mins = Math.floor( rem / 60 );
			rem = rem - mins * 60;

			secs = rem;
		}
	}

	return (
		<div>
			<div className="event-countdown__date">{ eventTimestamp || eventDate }</div>
			<div className="event-countdown__counter">
				<p>
					<strong className="event-countdown__day">{ days }</strong>{ ' ' }
					{ _x( 'days', 'Countdown days remaining', 'jetpack-mu-wpcom' ) }
				</p>
				<p>
					<span>
						<strong className="event-countdown__hour">{ hours }</strong>{ ' ' }
						{ _x( 'hours', 'Countdown hours remaining', 'jetpack-mu-wpcom' ) }
					</span>
					<span>
						<strong className="event-countdown__minute">{ mins }</strong>{ ' ' }
						{ _x( 'minutes', 'Countdown minutes remaining', 'jetpack-mu-wpcom' ) }
					</span>
					<span>
						<strong className="event-countdown__second">{ secs }</strong>{ ' ' }
						{ _x( 'seconds', 'Countdown seconds remaining', 'jetpack-mu-wpcom' ) }
					</span>
				</p>
				<p>{ __( 'until', 'jetpack-mu-wpcom' ) }</p>
			</div>
			<div className="event-countdown__event-title">
				<p>{ eventTitle }</p>
			</div>
		</div>
	);
};

export default EventCountdown;
