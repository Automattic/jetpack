/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { PanelBody, RadioControl, SelectControl, Spinner } from '@wordpress/components';
import { InspectorControls } from '@wordpress/editor';

const defaultEvent = { label: __( 'Select event', 'jetpack' ), value: '' };

class EventbriteEdit extends Component {
	state = {
		fetchingEvents: true,
		events: [],
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

		this.setState( { events, fetchingEvents: false } );
	};

	setEvent = eventId => {
		this.props.setAttributes( { eventId: eventId } );
	};

	render() {
		const { eventId, useModal } = this.props.attributes;
		const { events, fetchingEvents } = this.state;

		if ( fetchingEvents ) {
			return (
				<div className="wp-block-jetpack-eventbrite is-loading">
					<Spinner />
					<p>{ __( 'Loading events…', 'jetpack' ) }</p>
				</div>
			);
		}

		return (
			<div className="wp-block-jetpack-eventbrite">
				<InspectorControls>
					<PanelBody>
						<RadioControl
							label={ __( 'Embed Type', 'jetpack' ) }
							help={ __(
								'Whether to embed the event inline, or as a button that opens a modal.',
								'jetpack'
							) }
							selected={ useModal ? 'modal' : 'inline' }
							options={ [
								{ label: __( 'Inline', 'jetpack' ), value: 'inline' },
								{ label: __( 'Modal', 'jetpack' ), value: 'modal' },
							] }
							onChange={ option => this.props.setAttributes( { useModal: 'modal' === option } ) }
						/>
					</PanelBody>
				</InspectorControls>

				<SelectControl
					label={ __( 'Event', 'jetpack' ) }
					value={ eventId }
					options={ [ defaultEvent, ...events ] }
					onChange={ this.setEvent }
				/>
			</div>
		);
	}
}

export default EventbriteEdit;
