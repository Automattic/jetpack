/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { Spinner, SelectControl } from '@wordpress/components';

import apiFetch from '@wordpress/api-fetch';

function getUserEventList( setUserEventList ) {
	const fetchRequest = apiFetch( {
		path: '/eventbrite/v1/events/user',
	} );

	fetchRequest.then(
		response => {
			const eventList = response.events.map( event => {
				return { label: event.post_title, value: event.ID };
			} );
			setUserEventList( {
				loadingList: false,
				eventList,
			} );
		},
		xhr => {
			// reject
			if ( xhr.statusText === 'abort' ) {
				return;
			}
			setUserEventList( {
				loadingList: false,
				eventList: [],
			} );
		}
	);
}
export const EventList = () => {
	const [ userEventList, setUserEventList ] = useState( {
		loadingList: true,
		eventList: [],
	} );
	useEffect( () => {
		getUserEventList( setUserEventList );
	} );

	return (
		<div>
			{ userEventList.loadingList && <Spinner /> }
			{ userEventList.eventList.length > 0 && (
				<SelectControl
					label={ __( 'Your events', 'jetpack' ) }
					value="1"
					options={ userEventList.eventList }
					onChange={ () => {
						// Do something.
					} }
				/>
			) }
		</div>
	);
};
