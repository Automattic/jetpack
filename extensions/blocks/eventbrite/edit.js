/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { BlockControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	IconButton,
	PanelBody,
	Placeholder,
	RadioControl,
	TextControl,
	Toolbar,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/editor';
import EmbedPreview from '../embed-block/embed-preview';

/**
 * Internal dependences
 */

class EventbriteEdit extends Component {
	state = {
		embedCode: '',
		editingEmbed: false,
	};

	getEventAttributes = () => {
		const { embedCode } = this.state;

		const eventIdMatch = embedCode.match( /eventId.*?(\d+)/ );
		const useModalMatch = embedCode.match( /modal.*?(true|TRUE)/ );

		return {
			eventId: eventIdMatch ? eventIdMatch[ 1 ] : null,
			useModal: !! useModalMatch,
		};
	};

	setEvent = event => {
		if ( event ) {
			event.preventDefault();
		}

		const eventAttributes = this.getEventAttributes();

		this.props.setAttributes( eventAttributes );
		this.setState( { editingEmbed: false } );
	};

	setEmbedCode = embedCode => {
		this.setState( { embedCode } );
	};

	render() {
		const { className, isSelected } = this.props;
		const { eventId, useModal } = this.props.attributes;
		const { editingEmbed } = this.state;
		const containerId = `eventbrite-widget-container-${ eventId }`;
		const modalId = `eventbrite-widget-modal-trigger-${ eventId }`;
		const html =
			`
			<script>
				window.EBWidgets.createWidget({
					widgetType: 'checkout',
					eventId: ${ eventId },
					modal: ${ useModal },
					modalTriggerElementId: '${ modalId }',
					iframeContainerId: '${ containerId }',
				});
			</script>` + useModal
				? `<button id="${ modalId }" type="button">${ __( 'Buy Tickets', 'jetpack' ) }</button>`
				: `<div id="${ containerId }"></div>`;
		const preview = {
			html,
			scripts: [ 'https://www.eventbrite.com/static/widgets/eb_widgets.js' ],
		};

		const sidebarControls = (
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
		);

		if ( ! eventId || editingEmbed ) {
			return (
				<div className={ className }>
					{ sidebarControls }

					<Placeholder label={ __( 'Eventbrite', 'jetpack' ) }>
						<ol className="components-placeholder__instructions">
							<li>
								{ __( "Location the embed code for the event you'd like to share.", 'jetpack' ) }
								<br />
								<Button
									isDefault
									isLarge
									href={
										'https://www.eventbrite.com/support/articles/en_US/Multi_Group_How_To/how-to-sell-eventbrite-tickets-on-your-website-through-an-embedded-checkout'
									}
									target="_blank"
								>
									{ __( 'Location Embed Code', 'jetpack' ) }
								</Button>
							</li>
							<li>
								{ __( 'Paste the Embed code you copied from Eventbrite below.', 'jetpack' ) }
								<br />
								<form onSubmit={ this.setEvent }>
									<TextControl
										label={ __( 'Embed code', 'jetpack' ) }
										placeholder={ __( 'Enter embed code' ) }
										onChange={ this.setEmbedCode }
									/>
									<Button isSecondary type="submit">
										{ _x( 'Embed', 'button label', 'jetpack' ) }
									</Button>
								</form>
							</li>
							<ExternalLink href={ __( 'https://wordpress.org/support/article/embeds/' ) }>
								{ __( 'Learn more about embeds', 'jetpack' ) }
							</ExternalLink>
						</ol>
					</Placeholder>
				</div>
			);
		}

		return (
			<div className={ className }>
				{ sidebarControls }

				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-toolbar__control"
							label={ __( 'Edit Embed', 'jetpack' ) }
							icon="edit"
							onClick={ () => this.setState( { editingEmbed: true } ) }
						/>
					</Toolbar>
				</BlockControls>

				<EmbedPreview
					className={ 'eventbrite-preview' }
					preview={ preview }
					url={ `https://www.eventbrite.com/e/${ eventId }` }
					isSelected={ isSelected }
				/>
			</div>
		);
	}
}

export default EventbriteEdit;
