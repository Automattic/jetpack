/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Placeholder,
	SandBox,
	Button,
	IconButton,
	Toolbar,
	PanelBody,
	RadioControl,
	Spinner,
} from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/block-editor';
import { InspectorControls } from '@wordpress/editor';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { fallback } from './utils';
import { icon, URL_REGEX } from '.';

// Custom eventbrite urls use a subdomain of eventbrite.com.
const EVENTBRITE_CUSTOM_URL_REGEX = /.*(?:eventbrite\.[a-z.]+)\/?\s*$/i;

class EventbriteEdit extends Component {
	state = {
		editedUrl: this.props.attributes.url || '',
		editingUrl: false,
		// If this is a customized URL, we're going to need to find where it redirects to.
		resolvingRedirect: EVENTBRITE_CUSTOM_URL_REGEX.test( this.props.attributes.url ),
		// The interactive-related magic comes from Core's EmbedPreview component,
		// which currently isn't exported in a way we can use.
		interactive: false,
	};

	componentDidMount() {
		const { resolvingRedirect } = this.state;

		// Check if we need to resolve an Eventbrite URL immediately.
		if ( resolvingRedirect ) {
			this.resolveRedirect();
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		// Check if an Eventbrite URL has been entered, so we need to resolve it.
		if ( ! prevState.resolvingRedirect && this.state.resolvingRedirect ) {
			this.resolveRedirect();
		}
	}

	// TODO: figure out how to cancel request since apiFetch was updated to use Promises rather than XHR requests.
	componentWillUnmount() {
		// invoke( this.fetchRequest, [ 'abort' ] );
	}

	resolveRedirect = () => {
		const { url } = this.props.attributes;

		this.fetchRequest = apiFetch( {
			path: `/wpcom/v2/resolve-redirect/${ url }`,
		} );

		this.fetchRequest.then(
			resolvedUrl => {
				// resolve
				this.fetchRequest = null;
				this.props.setAttributes( { url: resolvedUrl } );
				this.setState( {
					resolvingRedirect: false,
					editedUrl: resolvedUrl,
				} );
			},
			xhr => {
				// reject
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.fetchRequest = null;
				this.setState( {
					resolvingRedirect: false,
					editingUrl: true,
				} );
			}
		);
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

		if ( EVENTBRITE_CUSTOM_URL_REGEX.test( url ) ) {
			// Setting the `resolvingRedirect` state here, then waiting for `componentDidUpdate()` to
			// be called before actually resolving it ensures that the `editedUrl` state has also been
			// updated before resolveRedirect() is called.
			this.setState( { resolvingRedirect: true } );
		}
	};

	cannotEmbed = () => {
		const { url } = this.props.attributes;

		return url && ! URL_REGEX.test( url );
	};

	renderLoading() {
		return (
			<div className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Embedding…' ) }</p>
			</div>
		);
	}

	renderControls() {
		const { setAttributes } = this.props;
		const { useModal } = this.props.attributes;
		return (
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
		);
	}

	renderEditEmbed() {
		const { className } = this.props;
		const { editedUrl } = this.state;
		return (
			<div className={ className }>
				{ this.renderControls() }

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
						{ this.cannotEmbed() && (
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

	renderPreview() {
		const { className } = this.props;
		const { url, useModal } = this.props.attributes;
		const { interactive } = this.state;

		const eventId = url ? url.substring( url.search( /\d+$/g ) ) : null;

		if ( ! eventId ) {
			return;
		}

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

		return (
			<div className={ className }>
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

				<SandBox html={ html } onFocus={ this.hideOverlay } />
				{ ! interactive && (
					<div
						className="block-library-embed__interactive-overlay"
						onMouseUp={ this.hideOverlay }
						role="none"
					/>
				) }
			</div>
		);
	}

	/**
	 * Render a preview of the Eventbrite embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		const { attributes } = this.props;
		const { url } = attributes;
		const { editingUrl, resolvingRedirect } = this.state;

		let component;

		if ( resolvingRedirect ) {
			component = this.renderLoading();
		} else if ( editingUrl || ! url || this.cannotEmbed() ) {
			component = this.renderEditEmbed();
		} else {
			component = this.renderPreview();
		}

		return (
			<>
				{ this.renderControls() }
				{ component }
			</>
		);
	}
}

export default EventbriteEdit;
