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
	withNotices,
} from '@wordpress/components';
import { BlockControls, BlockIcon, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { innerButtonBlock } from './';
import attributeDetails from './attributes';
import { convertToLink, eventIdFromUrl } from './utils';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import { icon, URL_REGEX, EVENTBRITE_EXAMPLE_URL } from '.';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import EventbriteInPageExample from './eventbrite-in-page-example.png';
import BlockStylesSelector from '../../shared/components/block-styles-selector';
import testEmbedUrl from '../../shared/test-embed-url';
import './editor.scss';
class EventbriteEdit extends Component {
	state = {
		editedUrl: this.props.attributes.url || '',
		editingUrl: false,
		isResolvingUrl: false,
	};

	componentDidMount() {
		const { url } = this.props.attributes;

		this.setUrl( url );
	}

	setUrl = url => {
		const { attributes, noticeOperations, setAttributes } = this.props;
		const { style } = attributes;

		if ( ! url || EVENTBRITE_EXAMPLE_URL === url || 'modal' === style ) {
			return;
		}

		const newAttributes = {
			eventId: eventIdFromUrl( url ),
			url,
		};

		testEmbedUrl( newAttributes.url, this.setIsResolvingUrl )
			.then( resolvedUrl => {
				const newValidatedAttributes = getValidatedAttributes( attributeDetails, {
					...newAttributes,
					url: resolvedUrl,
				} );
				setAttributes( newValidatedAttributes );
				this.setState( { editedUrl: resolvedUrl } );
				noticeOperations.removeAllNotices();
			} )
			.catch( () => {
				setAttributes( { eventId: undefined, url: undefined } );
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
				<Button isLink onClick={ () => convertToLink( editedUrl, onReplace ) }>
					{ _x( 'Convert block to link', 'button label', 'jetpack' ) }
				</Button>
			</>
		);
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

		return ! isResolvingUrl && url && ! URL_REGEX.test( url );
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
		const { style } = this.props.attributes;
		const { attributes, clientId, setAttributes } = this.props;

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
		const { className, noticeUI } = this.props;
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
					notices={ noticeUI }
				>
					<form onSubmit={ this.submitForm }>
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
		const { attributes } = this.props;
		const { url, style } = attributes;
		const { editingUrl, isResolvingUrl } = this.state;

		if ( isResolvingUrl ) {
			return this.renderLoading();
		}

		if ( editingUrl || ! url || this.cannotEmbed() ) {
			return this.renderEditEmbed();
		}

		return (
			<>
				{ this.renderInspectorControls() }
				{ this.renderBlockControls() }
				{ style === 'modal' ? (
					<InnerBlocks
						template={ [ [ innerButtonBlock.name, innerButtonBlock.attributes ] ] }
						templateLock="all"
					/>
				) : (
					this.renderInlinePreview()
				) }
			</>
		);
	}
}

export default withNotices( EventbriteEdit );
