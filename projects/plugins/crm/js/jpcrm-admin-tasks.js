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

/* global ajaxurl */
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
