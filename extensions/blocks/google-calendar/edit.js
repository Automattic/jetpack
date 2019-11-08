/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Placeholder, SandBox, Button, IconButton, Toolbar } from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { icon } from '.';
import { isMobile } from '../../../_inc/client/lib/viewport';

class GoogleCalendarEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			editedUrl: this.props.attributes.url || '',
			editingUrl: false,
			interactive: false,
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

	setUrl = event => {
		if ( event ) {
			event.preventDefault();
		}

		const { editedUrl: url } = this.state;

		this.props.setAttributes( { url } );
		this.setState( { editingUrl: false } );
	};

	/**
	 * Render a preview of the Google Calendar embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		const { attributes, className } = this.props;
		const { url } = attributes;
		const { editedUrl, interactive, editingUrl } = this.state;

		const height = isMobile() ? '300' : '500';

		const html = `<iframe src="${ url }" frameborder="0" width="100%" height=${ height }></iframe>`;

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

		if ( editingUrl || ! url ) {
			return (
				<div className={ className }>
					{ controls }
					<Placeholder
						label={ __( 'Google Calendar', 'jetpack' ) }
						icon={ <BlockIcon icon={ icon } /> }
					>
						<form onSubmit={ this.setUrl }>
							<input
								type="url"
								value={ editedUrl }
								className="components-placeholder__input"
								aria-label={ __( 'Google Calendar URL', 'jetpack' ) }
								placeholder={ __( 'Enter URL to embed here…', 'jetpack' ) }
								onChange={ event => this.setState( { editedUrl: event.target.value } ) }
							/>
							<Button isLarge type="submit">
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

export default GoogleCalendarEdit;
