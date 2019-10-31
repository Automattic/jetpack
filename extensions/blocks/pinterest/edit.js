/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Placeholder, SandBox, Button, IconButton, Toolbar } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { pinType } from './utils';
import { icon } from '.';
import './editor.scss';

class PinterestEdit extends Component {
	constructor() {
		super( ...arguments );

		this.hideOverlay = this.hideOverlay.bind( this );
		this.setUrl = this.setUrl.bind( this );

		this.state = {
			url: this.props.attributes.url,
			editingURL: false,
			// The interactive-related magic comes from Core's EmbedPreview component,
			// which currently isn't exported in a way we can use.
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

	hideOverlay() {
		// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
		// changing, because that happens on mouse down, and the overlay immediately disappears,
		// and the mouse event can end up in the preview content. We can't use onClick on
		// the overlay to hide it either, because then the editor misses the mouseup event, and
		// thinks we're multi-selecting blocks.
		this.setState( { interactive: true } );
	}

	setUrl( event ) {
		if ( event ) {
			event.preventDefault();
		}

		const { url } = this.state;
		this.setState( { editingURL: false } );
		this.props.setAttributes( { url } );
	}

	/**
	 * Render a preview of the Pinterest embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		const { attributes, className } = this.props;
		const { url } = attributes;
		const { interactive, editingURL } = this.state;

		const showEditor = ! url || editingURL;
		const type = pinType( url );
		const html = `<a data-pin-do='${ type }' href='${ url }'></a>`;

		// Disabled because the overlay div doesn't actually have a role or functionality
		// as far as the user is concerned. We're just catching the first click so that
		// the block can be selected without interacting with the embed preview that the overlay covers.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div className={ className }>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-toolbar__control"
							label={ __( 'Edit URL', 'jetpack' ) }
							icon="edit"
							onClick={ () => this.setState( { editingURL: true } ) }
						/>
					</Toolbar>
				</BlockControls>
				{ showEditor && (
					<Placeholder label={ __( 'Pinterest', 'jetpack' ) } icon={ icon }>
						<form onSubmit={ this.setUrl }>
							<input
								type="url"
								value={ url || '' }
								className="components-placeholder__input"
								aria-label={ __( 'Pinterest URL', 'jetpack' ) }
								placeholder={ __( 'Enter URL to embed here…', 'jetpack' ) }
								onChange={ event => this.setState( { url: event.target.value } ) }
							/>
							<Button isLarge type="submit">
								{ _x( 'Embed', 'button label', 'jetpack' ) }
							</Button>
						</form>
					</Placeholder>
				) }
				{ ! showEditor && (
					<div>
						<SandBox
							html={ html }
							scripts={ [ 'https://assets.pinterest.com/js/pinit.js' ] }
							onFocus={ this.hideOverlay }
						/>
						{ ! interactive && (
							<div
								className="block-library-embed__interactive-overlay"
								onMouseUp={ this.hideOverlay }
							/>
						) }
					</div>
				) }
			</div>
		);
	}
}

export default PinterestEdit;
