/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Placeholder,
	SandBox,
	Button,
	Notice,
	ExternalLink,
	PanelBody,
} from '@wordpress/components';
import { BlockIcon, InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { icon } from '.';
import { isMobile } from '../../../_inc/client/lib/viewport';
import { extractAttributesFromIframe, IFRAME_REGEX, URL_REGEX } from './utils';

class GoogleCalendarEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			editedEmbed: this.props.attributes.url || '',
			editingUrl: false,
			interactive: false,
			notice: null,
		};
	}

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

	handleEmbed = event => {
		if ( event ) {
			event.preventDefault();
		}
		const { editedEmbed } = this.state;
		const embedString = editedEmbed.trim();
		let attributes;

		if ( IFRAME_REGEX.test( embedString ) ) {
			attributes = extractAttributesFromIframe( embedString );
		} else {
			attributes = { url: embedString };
		}

		if ( ! URL_REGEX.test( attributes.url ) ) {
			this.setErrorNotice();
			return;
		}

		this.props.setAttributes( attributes );
		this.setState( { editingUrl: false, notice: null } );
	};

	setErrorNotice = () => {
		this.setState( {
			notice: __(
				"Your calendar couldn't be embedded. Please double check your URL or code.",
				'jetpack'
			),
		} );
	};

	/**
	 * Render a preview of the Google Calendar embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		const { attributes, className } = this.props;
		const { url } = attributes;
		const { editedEmbed, interactive, editingUrl } = this.state;

		const height = isMobile() ? '300' : '500';

		const html = `<iframe src="${ url }" style="border:0" scrolling="no" frameborder="0" width="100%" height=${ height }></iframe>`;

		const permissionsLink = (
			<ExternalLink href="https://en.support.wordpress.com/google-calendar/">
				{ __( 'Enable Permissions for the calender you want to share', 'jetpack' ) }
			</ExternalLink>
		);

		const controls = (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Calendar Settings', 'jetpack' ) } initialOpen={ false }>
						<form onSubmit={ this.handleEmbed } className={ `${ className }-embed-form-sidebar` }>
							<textarea
								type="text"
								value={ editedEmbed }
								className="components-placeholder__input"
								aria-label={ __( 'Google Calendar URL or iframe', 'jetpack' ) }
								placeholder={ __( 'Enter URL or iframe to embed here…', 'jetpack' ) }
								onChange={ event => this.setState( { editedEmbed: event.target.value } ) }
							/>
							<Button isSecondary isLarge type="submit">
								{ _x( 'Embed', 'button label', 'jetpack' ) }
							</Button>
						</form>
					</PanelBody>
				</InspectorControls>
			</>
		);

		if ( editingUrl || ! url ) {
			return (
				<div className={ className }>
					{ controls }
					<Placeholder
						className="wp-block-jetpack-google-calendar"
						label={ __( 'Google Calendar', 'jetpack' ) }
						icon={ <BlockIcon icon={ icon } /> }
						notices={
							this.state.notice && (
								<Notice status="error" isDismissible={ false }>
									{ this.state.notice }
								</Notice>
							)
						}
					>
						<p>
							{ __( 'Step 1)', 'jetpack' ) } { permissionsLink }
						</p>
						<p>
							{ __(
								'Step 2) Paste the embed code you copied from your Google Calendar below',
								'jetpack'
							) }
						</p>
						<form onSubmit={ this.handleEmbed }>
							<input
								type="text"
								value={ editedEmbed }
								className="components-placeholder__input"
								aria-label={ __( 'Google Calendar URL or iframe', 'jetpack' ) }
								placeholder={ __( 'Enter embed code or URL here', 'jetpack' ) }
								onChange={ event => this.setState( { editedEmbed: event.target.value } ) }
							/>
							<Button isSecondary isLarge type="submit">
								{ _x( 'Embed', 'button label', 'jetpack' ) }
							</Button>
						</form>
					</Placeholder>
				</div>
			);
		}

		// Disabled because the overlay div doesn't actually have a role or functionality
		// as far as the user is concerned. We're just catching the first click so that
		// the block can be selected without interacting with the embed preview that the overlay covers.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		// @todo: remove the key prop from Sandbox below when fix for https://github.com/WordPress/gutenberg/issues/16831 is available
		return (
			<div className={ className }>
				{ controls }
				<div>
					<SandBox html={ html } onFocus={ this.hideOverlay } key={ html } />
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

export default GoogleCalendarEdit;
