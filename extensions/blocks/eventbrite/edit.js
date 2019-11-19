/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { SelectControl } from '@wordpress/components';

const defaultEvent = { label: __( 'Select event', 'jetpack' ), value: '' };

class EventbriteEdit extends Component {
	state = {
		events: [],
		selectedEventID: null,
	};

	componentDidMount() {
		this.getEvents();
	}

	getEvents = async () => {
		const response = await apiFetch( {
			path: '/jetpack/v4/integrations/eventbrite',
		} );

		const events = response.events.map( event => ( {
			label: event.post_title,
			value: event.ID,
		} ) );

		this.setState( { events } );
	};

	render() {
		const { events, selectedEventID } = this.state;

		return (
			<SelectControl
				label={ __( 'Event', 'jetpack' ) }
				value={ selectedEventID }
				options={ [ defaultEvent, ...events ] }
				onChange={ eventID => {
					this.setState( { selectedEventID: eventID } );
				} }
			/>
		);
	}
}

export default EventbriteEdit;
