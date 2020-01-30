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
	Spinner,
	ExternalLink,
} from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/block-editor';
import { withDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import attributeDetails from './attributes';
import { convertToLink, eventIdFromUrl } from './utils';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import { icon, URL_REGEX } from '.';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import ModalButtonPreview from './modal-button-preview';
import EventbriteInPageExample from './eventbrite-in-page-example.png';
import BlockStylesSelector from '../../shared/components/block-styles-selector';
import './editor.scss';

const MODAL_BUTTON_STYLES = [
	{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
	{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
];

class EventbriteEdit extends Component {
	state = {
		editedUrl: this.props.attributes.url || '',
		editingUrl: false,
		// Resolve the url on mount if we haven't already set an eventId,
		// Such as when transforming from an Eventbrite link.
		resolvingUrl: this.props.attributes.url && ! this.props.attributes.eventId,
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
	// componentWillUnmount() {}

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

				this.props.setAttributes( {
					eventId: eventIdFromUrl( resolvedUrl ),
					url: resolvedUrl,
				} );
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

		const newAttributes = {
			eventId: eventIdFromUrl( url ),
			url,
		};
		const validatedAttributes = getValidatedAttributes( attributeDetails, newAttributes );

		this.props.setAttributes( validatedAttributes );

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
				<p>{ __( 'Embedding…', 'jetpack' ) }</p>
			</div>
		);
	}

	renderInspectorControls() {
		const { url, style } = this.props.attributes;
		const { attributes, clientId, setAttributes } = this.props;

		if ( ! url ) {
			return;
		}

		const embedTypes = [
			{
				value: 'inline',
				label: __( 'In-page Embed', 'jetpack' ),
				preview: (
					<div className="block-editor-block-preview__container">
						<img
							src={ EventbriteInPageExample }
							alt={ __( 'In page Eventbrite checkout example', 'jetpack' ) }
						/>
					</div>
				),
			},
			{
				value: 'modal',
				label: __( 'Button & Modal', 'jetpack' ),
			},
		];

		return (
			<BlockStylesSelector
				title={ _x(
					'Embed Type',
					'option for how the embed displays on a page, e.g. inline or as a modal',
					'jetpack'
				) }
				clientId={ clientId }
				styleOptions={ embedTypes }
				onSelectStyle={ setAttributes }
				activeStyle={ style }
				attributes={ attributes }
				viewportWidth={ 130 }
			/>
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

	// @todo Remove isDefault and isLarge from Button when the minimum WP version
	// supported by JP uses Gutenberg > 7.2
	renderEditEmbed() {
		const { className } = this.props;
		const { editedUrl } = this.state;
		const supportLink =
			isSimpleSite() || isAtomicSite()
				? 'http://support.wordpress.com/wordpress-editor/blocks/eventbrite-block/'
				: 'https://jetpack.com/support/jetpack-blocks/eventbrite-block/';

		return (
			<div className={ className }>
				<Placeholder
					label={ __( 'Eventbrite Checkout', 'jetpack' ) }
					instructions={ __(
						'Paste a link to an Eventbrite event to embed ticket checkout.',
						'jetpack'
					) }
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
						<Button isLarge isSecondary type="submit">
							{ _x( 'Embed', 'submit button label', 'jetpack' ) }
						</Button>
						{ this.cannotEmbed() && (
							<p className="components-placeholder__error">
								{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }
								<br />
								<Button isLarge onClick={ () => convertToLink( editedUrl, this.props.onReplace ) }>
									{ _x( 'Convert block to link', 'button label', 'jetpack' ) }
								</Button>
							</p>
						) }
					</form>

					<div className="components-placeholder__learn-more">
						<ExternalLink href={ supportLink }>
							{ __( 'Learn more about Eventbrite embeds', 'jetpack' ) }
						</ExternalLink>
					</div>
				</Placeholder>
			</div>
		);
	}

	renderInlinePreview() {
		const { className } = this.props;
		const { eventId } = this.props.attributes;

		if ( ! eventId ) {
			return;
		}

		const widgetId = `eventbrite-widget-${ eventId }`;
		const html = `
			<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
			<style>
				/* Prevent scrollbar on the embed preview */
				body {
					overflow: hidden;
				}
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
				{ /* Use an overlay to prevent interactivity with the preview, since the preview does not always resize correctly. */ }
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
		const { attributes, addModalButtonStyles, removeModalButtonStyles, isSelected } = this.props;
		const { url, style } = attributes;
		const { editingUrl, resolvingUrl } = this.state;

		let component;

		if ( resolvingUrl ) {
			removeModalButtonStyles();
			component = this.renderLoading();
		} else if ( editingUrl || ! url || this.cannotEmbed() ) {
			removeModalButtonStyles();
			component = this.renderEditEmbed();
		} else {
			// Don't add / remove button styles if blocks aren't selected
			// For example in previews
			if ( isSelected ) {
				if ( style === 'modal' ) {
					addModalButtonStyles();
				} else {
					removeModalButtonStyles();
				}
			}

			component = (
				<>
					{ this.renderBlockControls() }
					{ style === 'modal' ? (
						<ModalButtonPreview { ...this.props } />
					) : (
						this.renderInlinePreview()
					) }
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

export default withDispatch( ( dispatch, { name }, { select } ) => {
	const { getBlockStyles } = select( 'core/blocks' );
	const styles = getBlockStyles( name );
	return {
		addModalButtonStyles() {
			if ( styles.length < 1 ) {
				dispatch( 'core/blocks' ).addBlockStyles( name, MODAL_BUTTON_STYLES );
			}
		},
		removeModalButtonStyles() {
			if ( styles.length > 0 ) {
				dispatch( 'core/blocks' ).removeBlockStyles(
					name,
					MODAL_BUTTON_STYLES.map( style => style.name )
				);
			}
		},
	};
} )( EventbriteEdit );
