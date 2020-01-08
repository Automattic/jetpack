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
import { fallback, eventIdFromUrl } from './utils';
import { icon, URL_REGEX } from '.';
import ModalButtonPreview from './modal-button-preview';
import { EventList } from './event-list';

// Custom eventbrite urls use a subdomain of eventbrite.com.
const EVENTBRITE_CUSTOM_URL_REGEX = /.*(?:eventbrite\.[a-z.]+)\/?\s*$/i;

class EventbriteEdit extends Component {
	state = {
		editedUrl: this.props.attributes.url || '',
		editingUrl: false,
		// If this is a customized URL, we're going to need to find where it redirects to.
		resolvingUrl: EVENTBRITE_CUSTOM_URL_REGEX.test( this.props.attributes.url ),
		resolvedStatusCode: null,
	};

	componentDidMount() {
		const { resolvingUrl } = this.state;

		// Check if we need to resolve an Eventbrite URL immediately.
		if ( resolvingUrl ) {
			this.resolveUrl();
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		// Check if an Eventbrite URL has been entered, so we need to resolve it.
		if ( ! prevState.resolvingUrl && this.state.resolvingUrl ) {
			this.resolveUrl();
		}
	}

	// TODO: figure out how to cancel request since apiFetch was updated to use Promises rather than XHR requests.
	componentWillUnmount() {
		// invoke( this.fetchRequest, [ 'abort' ] );
	}

	resolveUrl = () => {
		const { url } = this.props.attributes;

		this.setState( { resolvedStatusCode: null } );

		this.fetchRequest = apiFetch( {
			path: `/wpcom/v2/resolve-redirect/${ url }`,
		} );

		this.fetchRequest.then(
			response => {
				// resolve
				this.fetchRequest = null;
				const resolvedUrl = response.url || url;
				const resolvedStatusCode = response.status ? parseInt( response.status, 10 ) : null;

				this.props.setAttributes( { url: resolvedUrl } );
				this.setState( {
					resolvingUrl: false,
					resolvedStatusCode,
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
					resolvingUrl: false,
					editingUrl: true,
				} );
			}
		);
	};

	setUrl = event => {
		if ( event ) {
			event.preventDefault();
		}

		const { editedUrl: url } = this.state;

		if ( ! url ) {
			return;
		}

		this.props.setAttributes( { url } );

		// Setting the `resolvingUrl` state here, then waiting for `componentDidUpdate()` to
		// be called before actually resolving it ensures that the `editedUrl` state has also been
		// updated before resolveUrl() is called.
		this.setState( {
			editingUrl: false,
			resolvingUrl: true,
		} );
	};

	cannotEmbed = () => {
		const { url } = this.props.attributes;
		const { resolvedStatusCode } = this.state;

		return (
			( url && ! URL_REGEX.test( url ) ) || ( resolvedStatusCode && resolvedStatusCode >= 400 )
		);
	};

	renderLoading() {
		return (
			<div className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Embedding…' ) }</p>
			</div>
		);
	}

	renderInspectorControls() {
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

	renderBlockControls() {
		return (
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
		);
	}

	renderEditEmbed() {
		const { className } = this.props;
		const { editedUrl } = this.state;
		return (
			<div className={ className }>
				<Placeholder
					label={ __( 'Eventbrite Tickets', 'jetpack' ) }
					icon={ <BlockIcon icon={ icon } /> }
				>
					<div>{ __( 'Enter an event link', 'jetpack' ) }</div>
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
						<div>{ __( 'Or select an event from your connected account', 'jetpack' ) }</div>
						<EventList />
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

	renderInlinePreview() {
		const { className } = this.props;
		const { url } = this.props.attributes;

		const eventId = url ? eventIdFromUrl( url ) : null;

		if ( ! eventId ) {
			return;
		}

		const widgetId = `eventbrite-widget-container-${ eventId }`;
		const html = `
			<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
			<style>
				/* Eventbrite embeds have a CSS height transition on loading, which causes <Sandbox>
				to not recognise the resizing. We need to disable that transition. */
				* {
					transition: none !important;
				}
			</style>
			<script>
				window.EBWidgets.createWidget({
					widgetType: 'checkout',
					eventId: ${ eventId },
					iframeContainerId: '${ widgetId }',
				});
			</script>
			<div id="${ widgetId }"></div>
		`;

		return (
			<div className={ className }>
				<SandBox html={ html } />
				{ /* Use an overlay to prevent interactivity with the preview, since the modal does not resize correctly. */ }
				<div className="block-library-embed__interactive-overlay" />
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
		const { url, useModal } = attributes;
		const { editingUrl, resolvingUrl } = this.state;

		let component;

		if ( resolvingUrl ) {
			component = this.renderLoading();
		} else if ( editingUrl || ! url || this.cannotEmbed() ) {
			component = this.renderEditEmbed();
		} else {
			component = (
				<>
					{ this.renderBlockControls() }
					{ useModal ? <ModalButtonPreview { ...this.props } /> : this.renderInlinePreview() }
				</>
			);
		}

		return (
			<>
				{ this.renderInspectorControls() }
				{ component }
			</>
		);
	}
}

export default EventbriteEdit;
