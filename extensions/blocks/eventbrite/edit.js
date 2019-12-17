/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import {
	Placeholder,
	SandBox,
	Button,
	IconButton,
	Toolbar,
	PanelBody,
	RadioControl,
} from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/block-editor';
import { InspectorControls } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { fallback } from './utils';
import { icon } from '.';

class EventbriteEdit extends Component {
	state = {
		editedUrl: this.props.attributes.url || '',
		editingUrl: false,
		// The interactive-related magic comes from Core's EmbedPreview component,
		// which currently isn't exported in a way we can use.
		interactive: false,
	};

	static getDerivedStateFromProps( nextProps, state ) {
		if ( ! nextProps.isSelected && state.interactive ) {
			// We only want to change this when the block is not selected, because changing it when
			// the block becomes selected makes the overlap disappear too early. Hiding the overlay
			// happens on mouseup when the overlay is clicked.
			return { interactive: false };
		}

		return null;
	}

	hideOverlay = () => {
		// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
		// changing, because that happens on mouse down, and the overlay immediately disappears,
		// and the mouse event can end up in the preview content. We can't use onClick on
		// the overlay to hide it either, because then the editor misses the mouseup event, and
		// thinks we're multi-selecting blocks.
		this.setState( { interactive: true } );
	};

	setUrl = event => {
		if ( event ) {
			event.preventDefault();
		}

		const { editedUrl: url } = this.state;

		this.props.setAttributes( { url } );
		this.setState( { editingUrl: false } );
	};

	/**
	 * Render a preview of the Eventbrite embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		const { attributes, className, setAttributes } = this.props;
		const { url, useModal } = attributes;
		const { editedUrl, interactive, editingUrl } = this.state;

		const eventId = url.substring( url.search( /\d+$/g ) );

		let html = `
			<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
			<style>
				* {
					// Eventbrite embeds have a CSS height transition on loading, which causes <Sandbox>
					// to not recognise the resizing. We need to disable that transition.
					transition: none !important;
				}
			</style>
		`;
		if ( useModal ) {
			html += `
				<script>
					window.EBWidgets.createWidget({
						widgetType: 'checkout',
						eventId: ${ eventId },
						modal: true,
						modalTriggerElementId: 'eventbrite-widget-modal-trigger-${ eventId }',
					});
				</script>
				<button id="eventbrite-widget-modal-trigger-${ eventId }" type="button">Buy Tickets</button>
			`;
		} else {
			html += `
				<script>
					window.EBWidgets.createWidget({
						widgetType: 'checkout',
						eventId: ${ eventId },
						iframeContainerId: 'eventbrite-widget-container-${ eventId }',
					});
				</script>
				<div id="eventbrite-widget-container-${ eventId }"></div>
			`;
		}

		const cannotEmbed = ! url;

		const controls = (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-toolbar__control"
							label={ __( 'Edit URL', 'jetpack' ) }
							icon="edit"
							onClick={ () => this.setState( { editingUrl: true } ) }
						/>
					</Toolbar>
				</BlockControls>
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
							onChange={ option => setAttributes( { useModal: 'modal' === option } ) }
						/>
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);

		if ( editingUrl || ! url ) {
			return (
				<div className={ className }>
					{ controls }
					<Placeholder
						label={ __( 'Eventbrite Tickets', 'jetpack' ) }
						icon={ <BlockIcon icon={ icon } /> }
					>
						<form onSubmit={ this.setUrl }>
							<input
								type="url"
								value={ editedUrl }
								className="components-placeholder__input"
								aria-label={ __( 'Eventbrite URL', 'jetpack' ) }
								placeholder={ __( 'Enter an event URL to embed here…', 'jetpack' ) }
								onChange={ event => this.setState( { editedUrl: event.target.value } ) }
							/>
							<Button isLarge type="submit">
								{ _x( 'Embed', 'button label', 'jetpack' ) }
							</Button>
							{ cannotEmbed && (
								<p className="components-placeholder__error">
									{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }
									<br />
									<Button isLarge onClick={ () => fallback( editedUrl, this.props.onReplace ) }>
										{ _x( 'Convert to link', 'button label', 'jetpack' ) }
									</Button>
								</p>
							) }
						</form>
					</Placeholder>
				</div>
			);
		}

		// Disabled because the overlay div doesn't actually have a role or functionality
		// as far as the user is concerned. We're just catching the first click so that
		// the block can be selected without interacting with the embed preview that the overlay covers.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div className={ className }>
				{ controls }
				<div>
					<SandBox html={ html } onFocus={ this.hideOverlay } />
					{ ! interactive && (
						<div
							className="block-library-embed__interactive-overlay"
							onMouseUp={ this.hideOverlay }
						/>
					) }
				</div>
			</div>
		);
	}
}

export default EventbriteEdit;
