import apiFetch from '@wordpress/api-fetch';
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import {
	Placeholder,
	SandBox,
	Button,
	Spinner,
	TextControl,
	ToolbarButton,
	ToggleControl,
	PanelBody,
	SelectControl,
	withNotices,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import BlockStylesSelector from '../../shared/components/block-styles-selector';
import testEmbedUrl from '../../shared/test-embed-url';
import defaultExample from './default-example.png';
import gridExample from './grid-example.png';
import icon from './icon';
import {
	GOODREADS_SHELF_OPTIONS,
	GOODREADS_ORDER_OPTIONS,
	GOODREADS_SORT_OPTIONS,
	createGoodreadsEmbedLink,
} from './utils';

const GoodreadsEdit = props => {
	const { attributes, className, clientId, noticeOperations, noticeUI, setAttributes } = props;

	const [ userInput, setUserInput ] = useState( '' );
	const [ displayPreview, setDisplayPreview ] = useState( false );
	const [ isResolvingUrl, setIsResolvingUrl ] = useState( false );
	const prevPropsRef = useRef( null );

	useEffect( () => {
		setUrl( attributes.userInput );
	}, [ attributes.userInput ] );

	useEffect( () => {
		if (
			prevPropsRef.current &&
			attributes.widgetId === prevPropsRef.current.attributes.widgetId
		) {
			setRequestLink();
			setAttributes( { widgetId: Math.floor( Math.random() * 9999999 ) } );
		}
		prevPropsRef.current = props;
	}, [ props ] );

	const setUrl = input => {
		if ( ! input ) {
			setIsResolvingUrl( false );
			return;
		}

		const widgetId = Math.floor( Math.random() * 9999999 );
		const regex = /\/(user|author)\/show\/(\d+)/;
		const goodreadsId = input.match( regex ) ? input.match( regex )[ 2 ] : false;

		if ( ! goodreadsId || ! /^(https?:\/\/)?(www\.)?goodreads\.com/.test( input ) ) {
			return setErrorNotice();
		}

		if ( /\/author\//.test( input ) ) {
			setIsResolvingUrl( true );
			apiFetch( { path: `/wpcom/v2/goodreads/user-id?id=${ goodreadsId }` } )
				.then( response => {
					if ( response === 404 ) {
						setAttributes( { widgetId: undefined, userInput: input } );
						setErrorNotice();
						return;
					}
					setAttributes( { goodreadsId: response, widgetId, input } );
					setRequestLink();
					setDisplayPreview( true );
					setIsResolvingUrl( false );
				} )
				.catch( () => {
					setAttributes( { widgetId: undefined, userInput: undefined } );
					setErrorNotice();
				} );
		} else {
			testEmbedUrl( input, setIsResolvingUrl )
				.then( response => {
					if ( response.endsWith( '/author' ) ) {
						setAttributes( { widgetId: undefined, userInput: undefined } );
						setErrorNotice();
						return;
					}

					setAttributes( { goodreadsId: goodreadsId, widgetId, userInput: input } );
					setRequestLink();
					setDisplayPreview( true );
					setIsResolvingUrl( false );
				} )
				.catch( () => {
					setAttributes( { widgetId: undefined, userInput: undefined } );
					setErrorNotice();
				} );
		}
	};

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			<>{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }</>
		);
	};

	const setRequestLink = () => {
		const selector = attributes.style === 'grid' ? 'gr_grid_widget_' : 'gr_custom_widget';
		setAttributes( {
			link: createGoodreadsEmbedLink( { attributes } ),
			id: selector + attributes.widgetId,
		} );
	};

	const submitForm = event => {
		if ( event ) {
			event.preventDefault();
		}

		setUrl( userInput.trim() );
	};

	const cannotEmbed = () => {
		return ! isResolvingUrl && attributes.url;
	};

	const renderLoading = () => {
		return (
			<div className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Embedding…', 'jetpack' ) }</p>
			</div>
		);
	};

	const renderDisplaySettings = () => {
		const { showCover, showAuthor, showTitle, showRating, showReview, showTags } = attributes;

		return (
			<>
				<ToggleControl
					label={ __( 'Show cover', 'jetpack' ) }
					checked={ showCover }
					onChange={ () => setAttributes( { showCover: ! showCover } ) }
				/>

				<ToggleControl
					label={ __( 'Show author', 'jetpack' ) }
					checked={ showAuthor }
					onChange={ () => setAttributes( { showAuthor: ! showAuthor } ) }
				/>

				<ToggleControl
					label={ __( 'Show title', 'jetpack' ) }
					checked={ showTitle }
					onChange={ () => setAttributes( { showTitle: ! showTitle } ) }
				/>

				<ToggleControl
					label={ __( 'Show rating', 'jetpack' ) }
					checked={ showRating }
					onChange={ () => setAttributes( { showRating: ! showRating } ) }
				/>

				<ToggleControl
					label={ __( 'Show review', 'jetpack' ) }
					checked={ showReview }
					onChange={ () => setAttributes( { showReview: ! showReview } ) }
				/>

				<ToggleControl
					label={ __( 'Show tags', 'jetpack' ) }
					checked={ showTags }
					onChange={ () => setAttributes( { showTags: ! showTags } ) }
				/>
			</>
		);
	};

	const renderInspectorControls = () => {
		const { style, shelfOption, bookNumber, orderOption, customTitle, sortOption } = attributes;

		const embedTypes = [
			{
				value: 'default',
				label: __( 'Default', 'jetpack' ),
				preview: (
					<div className="block-editor-block-preview__container">
						<img
							src={ defaultExample }
							alt={ __( 'Example of Goodreads default block', 'jetpack' ) }
						/>
					</div>
				),
			},
			{
				value: 'grid',
				label: __( 'Grid', 'jetpack' ),
				preview: (
					<div className="block-editor-block-preview__container">
						<img
							src={ gridExample }
							alt={ __( 'Default example of Goodreads grid block', 'jetpack' ) }
						/>
					</div>
				),
			},
		];

		return (
			<InspectorControls>
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
				<PanelBody PanelBody title={ __( 'Goodreads Settings', 'jetpack' ) } initialOpen>
					<SelectControl
						label={ __( 'Shelf', 'jetpack' ) }
						value={ shelfOption }
						onChange={ value => setAttributes( { shelfOption: value } ) }
						options={ GOODREADS_SHELF_OPTIONS }
					/>

					<TextControl
						label={ __( 'Title', 'jetpack' ) }
						value={ customTitle || __( 'My Bookshelf', 'jetpack' ) }
						onChange={ value => setAttributes( { customTitle: value } ) }
					/>

					<SelectControl
						label={ __( 'Sort by', 'jetpack' ) }
						value={ sortOption }
						onChange={ value => setAttributes( { sortOption: value } ) }
						options={ GOODREADS_SORT_OPTIONS }
					/>

					<SelectControl
						label={ __( 'Order', 'jetpack' ) }
						value={ orderOption }
						onChange={ value => setAttributes( { orderOption: value } ) }
						options={ GOODREADS_ORDER_OPTIONS }
					/>

					<TextControl
						label={ __( 'Number of books', 'jetpack' ) }
						type="number"
						inputMode="numeric"
						min="1"
						max={ style === 'grid' ? 200 : 100 }
						value={ bookNumber || 5 }
						onChange={ value => setAttributes( { bookNumber: value } ) }
					/>

					{ style === 'default' && renderDisplaySettings() }
				</PanelBody>
			</InspectorControls>
		);
	};

	const renderEditEmbed = () => {
		return (
			<div className={ className }>
				<Placeholder
					label={ __( 'Goodreads', 'jetpack' ) }
					instructions={ __( 'Paste a link to a Goodreads profile.', 'jetpack' ) }
					icon={ <BlockIcon icon={ icon } /> }
					notices={ noticeUI }
				>
					<form onSubmit={ submitForm }>
						<input
							type="url"
							value={ userInput }
							className="components-placeholder__input"
							aria-label={ __( 'Goodreads profile URL', 'jetpack' ) }
							placeholder={ __( 'Enter a Goodreads profile URL to embed here…', 'jetpack' ) }
							onChange={ event => setUserInput( event.target.value ) }
						/>
						<Button variant="secondary" type="submit">
							{ _x( 'Embed', 'submit button label', 'jetpack' ) }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	};

	const renderBlockControls = () => {
		return (
			<BlockControls>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Edit URL', 'jetpack' ) }
					icon="edit"
					onClick={ () => setDisplayPreview( false ) }
				/>
			</BlockControls>
		);
	};

	const renderInlinePreview = () => {
		const { goodreadsId, link, id } = attributes;

		if ( ! goodreadsId ) {
			return;
		}

		const html = `
		<style> [class^=gr_custom_container_] { border: 1px solid gray; border-radius: 10px; margin: auto; padding: 0 5px 10px 5px; background-color: #fff; color: #000; width: 300px; }  [class^=gr_custom_header_] { border-bottom: 1px solid gray; width: 100%; padding: 10px 0; margin: auto; text-align: center; font-size: 120%; }  [class^=gr_custom_each_container_] { width: 100%; clear: both; margin: auto; overflow: auto; padding-bottom: 4px; border-bottom: 1px solid #aaa; }  [class^=gr_custom_each_container_] { width: 100%; clear: both; margin-bottom: 10px; overflow: auto; padding-bottom: 4px; border-bottom: 1px solid #aaa; }  [class^=gr_custom_book_container_] { overflow: hidden; height: 60px; float: left; margin-right: 6px; width: 39px; }  [class^=gr_custom_author_] { font-size: 10px; }  [class^=gr_custom_tags_] { font-size: 10px; color: gray; }  [class^=gr_custom_rating_] { float: right; }  [class^=gr_grid_book_container] { float: left; width: 98px; height: 160px; padding: 0px 0px; overflow: hidden; }  [class^=gr_grid_book_container] img { height: 100%; width: 100%; }  a { text-decoration: none; }  a:hover { text-decoration: underline; }  img { max-width: 100%; }</style>
		<script src="${ link }"></script>
      	<div id="${ id }"></div>
    	`;

		return (
			<div className={ className }>
				<SandBox title="Goodreads" html={ html } />
				<div className="block-library-embed__interactive-overlay" />
			</div>
		);
	};

	useEffect( () => {
		setUrl( attributes.userInput );
	}, [] );

	if ( isResolvingUrl ) {
		return renderLoading();
	}

	// Example block in preview.
	if ( attributes.goodreadsId === 1176283 ) {
		return renderInlinePreview();
	}

	if ( displayPreview && ! cannotEmbed() ) {
		return (
			<>
				{ renderInspectorControls() }
				{ renderBlockControls() }
				{ renderInlinePreview() }
			</>
		);
	}

	return renderEditEmbed();
};

export default withNotices( GoodreadsEdit );
