/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	ExternalLink,
	PanelBody,
	Placeholder,
	RadioControl,
	SelectControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/editor';

/**
 * Internal dependences
 */
import requestExternalAccess from 'lib/sharing';

const defaultEvent = { label: __( 'Select event', 'jetpack' ), value: '' };

class EventbriteEdit extends Component {
	state = {};

	setEvent = eventId => {
		this.props.setAttributes( { eventId: eventId } );
	};

	render() {
		const { eventId, useModal } = this.props.attributes;

		return (
			<div className="wp-block-jetpack-eventbrite">
				{ /* <InspectorControls>
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
				</InspectorControls> */ }

				<Placeholder label={ __( 'Eventbrite', 'jetpack' ) }>
					<ol className="components-placeholder__instructions">
						<li>
							{ __( "Location the embed code for the event you'd like to share.", 'jetpack' ) }
							<br />
							<Button isDefault isLarge href={ '' } target="_blank">
								{ __( 'Location Embed Code', 'jetpack' ) }
							</Button>
						</li>
						<li>
							{ __( 'Paste the Embed code you copied from Eventbrite below.', 'jetpack' ) }
							<br />
							<TextControl label={ __( 'Embed code', 'jetpack' ) } />
						</li>
						<ExternalLink href={ '#' }>{ __( 'Learn more about embeds', 'jetpack' ) }</ExternalLink>
					</ol>
				</Placeholder>
			</div>
		);
	}
}

export default EventbriteEdit;
