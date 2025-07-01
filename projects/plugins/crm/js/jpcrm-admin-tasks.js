/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4
 *
 * Copyright 2020 Automattic
 * New Task UI JS for the Calendar functionality
 *
 * Date: 15th August 2018
 */

/* global FullCalendar, ajaxurl, jpcrm_fullcalendar_data, jpcrm */
window.jpcrm_task_ajax_blocker = false;

function jpcrm_update_task_status( task_id, new_status ) {
	if ( task_id === 0 || window.jpcrm_task_ajax_blocker ) {
		return;
	}

	window.jpcrm_task_ajax_blocker = true;
	buttons.forEach( b => b.classList.add( 'disabled', 'loading' ) );

	const data = {
		action: 'mark_task_complete',
		taskID: task_id,
		status: new_status,
		sec: window.zbs_root.zbsnonce,
	};

	fetch( ajaxurl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams( data ).toString(),
	} )
		.then( r => {
			if ( r.status !== 200 ) {
				throw Error( 'Error updating task status!' );
			}
			return r.json();
		} )
		.then( response => {
			document.getElementById( 'zbs-task-complete' ).value = response.data.status;
			buttons.forEach( b =>
				b.classList.toggle( 'hidden', +b.dataset.status !== response.data.status )
			);
		} )
		.catch( err => {
			// eslint-disable-next-line no-console -- Debug if there's an error.
			console.log( err );
		} )
		.finally( () => {
			buttons.forEach( b => b.classList.remove( 'disabled', 'loading' ) );
			window.jpcrm_task_ajax_blocker = false;
		} );
}

const buttons = document.querySelectorAll( '#mark-complete-task button' );
buttons.forEach( el =>
	el.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		const task_id = el.closest( '[id^="task-"]' ).id.slice( 5 );
		const new_status = -document.getElementById( 'zbs-task-complete' ).value;
		jpcrm_update_task_status( task_id, new_status );
	} )
);

document.addEventListener( 'DOMContentLoaded', function () {
	const calendarEl = document.getElementById( 'calendar' );
	if ( ! calendarEl ) {
		return;
	}
	const calendar = new FullCalendar.Calendar( calendarEl, {
		locale: jpcrm_fullcalendar_data.locale,
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: 'dayGridMonth,timeGridWeek timeGridDay,listMonth',
		},
		initialView: 'dayGridMonth',
		navLinks: true,
		weekends: true,
		firstDay: jpcrm_fullcalendar_data.firstDay,
		events: jpcrm_fullcalendar_data.events,
		eventContent: args => {
			const eventProps = args.event._def.extendedProps;
			const avatarHTML = eventProps.avatar
				? '<img class="jpcrm-avatar" src="' + jpcrm.esc_attr( eventProps.avatar ) + '"/>'
				: '';
			const completeHTML = eventProps.complete === 1 ? '<i class="fa fa-check"></i></span>' : '';
			const decodedTitle = args.event.title ? jpcrm.decodeHTMLEntities( args.event.title ) : '';
			let eventText = jpcrm.esc_html( decodedTitle );
			if ( args.view.type !== 'listMonth' ) {
				// listMonth has the timeText displayed already.
				eventText = args.timeText + ' ' + eventText;
			}
			let html = avatarHTML + completeHTML + eventText;
			html =
				'<div class="event_html" title="' + jpcrm.esc_attr( decodedTitle ) + '">' + html + '</div>';
			if ( args.view.type === 'listMonth' ) {
				// All the other views add the link automatically, but not this one.
				html = '<a href="' + jpcrm.esc_attr( args.event._def.url ) + '">' + html + '</a>';
			}
			return {
				html: html,
			};
		},
	} );
	calendar.render();
} );
