/**
 * External dependencies
 */
import { invoke } from 'lodash';
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Button,
	IconButton,
	PanelBody,
	Placeholder,
	RadioControl,
	SandBox,
	Spinner,
	Toolbar,
} from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/block-editor';
import { InspectorControls } from '@wordpress/editor';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependences
 */
import { fallback } from './utils';
// import { icon } from '.';

const EVENTBRITE_URL_REGEX = /^https?:\/\/(.+?\.)?eventbrite\.com(\.[a-z]{2,4})*\/.+/i;

class EventbriteEdit extends Component {
	state = {
		editedUrl: this.props.attributes.url || '',
		editingUrl: false,
		// If this is a customized URL, we're going to need to find where it redirects to.
		resolvingRedirect: EVENTBRITE_URL_REGEX.test( this.props.attributes.url ),
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

	componentWillUnmount() {
		invoke( this.fetchRequest, [ 'abort' ] );
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

		if ( EVENTBRITE_URL_REGEX.test( url ) ) {
			// Setting the `resolvingRedirect` state here, then waiting for `componentDidUpdate()` to
			// be called before actually resolving it ensures that the `editedUrl` state has also been
			// updated before resolveRedirect() is called.
			this.setState( { resolvingRedirect: true } );
		}
	};

	/**
	 * Render a preview of the Eventbrite embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		const { attributes, cannotEmbed, className, preview } = this.props;
		const { url, useModal } = attributes;
		const { editedUrl, interactive, editingUrl, resolvingRedirect } = this.state;

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
		</InspectorControls>;

		if ( resolvingRedirect ) {
			return (
				<div className="wp-block-embed is-loading">
					<Spinner />
					<p>{ __( 'Embedding…' ) }</p>
				</div>
			);
		}

		const controls = (
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

		if ( editingUrl || ! url || cannotEmbed ) {
			return (
				<div className={ className }>
					{ controls }
					<Placeholder label={ __( 'Eventbrite', 'jetpack' ) } icon={ <BlockIcon icon={ '' } /> }>
						<form onSubmit={ this.setUrl }>
							<input
								type="url"
								value={ editedUrl }
								className="components-placeholder__input"
								aria-label={ __( 'Eventbrite URL', 'jetpack' ) }
								placeholder={ __( 'Enter URL to embed here…', 'jetpack' ) }
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
					<SandBox html={ preview.html } scripts={ preview.scripts } onFocus={ this.hideOverlay } />
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
