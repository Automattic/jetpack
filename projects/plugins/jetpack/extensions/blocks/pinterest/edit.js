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
	Spinner,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { fallback, pinType } from './utils';
import { icon, PINTEREST_EXAMPLE_URL } from '.';
import testEmbedUrl from '../../shared/test-embed-url';

class PinterestEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			editedUrl: this.props.attributes.url || '',
			editingUrl: false,
			// The interactive-related magic comes from Core's EmbedPreview component,
			// which currently isn't exported in a way we can use.
			interactive: false,
			isResolvingUrl: false,
		};
	}

	componentDidMount() {
		const { url } = this.props.attributes;

		this.setUrl( url );
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

	setUrl = url => {
		const { noticeOperations, setAttributes } = this.props;

		if ( ! url || PINTEREST_EXAMPLE_URL === url ) {
			return;
		}

		testEmbedUrl( url, this.setIsResolvingUrl )
			.then( resolvedUrl => {
				setAttributes( { url: resolvedUrl } );
				this.setState( { editedUrl: resolvedUrl } );
				noticeOperations.removeAllNotices();
			} )
			.catch( () => {
				setAttributes( { url: undefined } );
				this.setErrorNotice();
			} );
	};

	setIsResolvingUrl = isResolvingUrl => this.setState( { isResolvingUrl } );

	setErrorNotice = () => {
		const { noticeOperations, onReplace } = this.props;
		const { editedUrl } = this.state;

		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			<>
				{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }{ ' ' }
				<Button isLink onClick={ () => fallback( editedUrl, onReplace ) }>
					{ _x( 'Convert block to link', 'button label', 'jetpack' ) }
				</Button>
			</>
		);
	};

	hideOverlay = () => {
		// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
		// changing, because that happens on mouse down, and the overlay immediately disappears,
		// and the mouse event can end up in the preview content. We can't use onClick on
		// the overlay to hide it either, because then the editor misses the mouseup event, and
		// thinks we're multi-selecting blocks.
		this.setState( { interactive: true } );
	};

	submitForm = event => {
		if ( event ) {
			event.preventDefault();
		}

		const { editedUrl } = this.state;

		this.setUrl( editedUrl );

		this.setState( { editingUrl: false } );
	};

	cannotEmbed = () => {
		const { url } = this.props.attributes;
		const { isResolvingUrl } = this.state;
		const type = pinType( url );

		return ! isResolvingUrl && url && ! type;
	};

	render() {
		const { attributes, className, noticeUI } = this.props;
		const { url } = attributes;
		const { editedUrl, interactive, editingUrl, isResolvingUrl } = this.state;

		if ( isResolvingUrl ) {
			return (
				<div className="wp-block-embed is-loading">
					<Spinner />
					<p>{ __( 'Embedding…', 'jetpack' ) }</p>
				</div>
			);
		}

		const type = pinType( url );
		const html = `<a data-pin-do='${ type }' href='${ url }'></a>`;

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

		if ( editingUrl || ! url || this.cannotEmbed() ) {
			return (
				<div className={ className }>
					<Placeholder
						label={ __( 'Pinterest', 'jetpack' ) }
						icon={ <BlockIcon icon={ icon } /> }
						notices={ noticeUI }
					>
						<form onSubmit={ this.submitForm }>
							<input
								type="url"
								value={ editedUrl }
								className="components-placeholder__input"
								aria-label={ __( 'Pinterest URL', 'jetpack' ) }
								placeholder={ __( 'Enter URL to embed here…', 'jetpack' ) }
								onChange={ event => this.setState( { editedUrl: event.target.value } ) }
							/>
							<Button isLarge isSecondary type="submit">
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
			</div>
		);
	}
}

export default withNotices( PinterestEdit );
