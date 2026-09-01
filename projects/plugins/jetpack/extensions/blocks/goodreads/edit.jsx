import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Placeholder, SandBox, Button, Spinner, withNotices } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import metadata from './block.json';
import { GoodreadsBlockControls, GoodreadsInspectorControls } from './controls';
import useFetchGoodreadsData from './hooks/use-fetch-goodreads-data';
import { createGoodreadsEmbedLink } from './utils';

const GoodreadsEdit = props => {
	const { attributes, className, noticeOperations, noticeUI, setAttributes } = props;
	const [ userInput, setUserInput ] = useState( '' );
	const [ url, setUrl ] = useState( '' );
	const [ isResolvingUrl, setIsResolvingUrl ] = useState( false );
	const blockProps = useBlockProps();

	const { isFetchingData, goodreadsUserId, isError } = useFetchGoodreadsData( url );
	const { goodreadsId, widgetId, link, style } = attributes;
	const hasSyncedRef = useRef( false );

	useEffect( () => {
		if ( isFetchingData ) {
			setIsResolvingUrl( true );
		}

		if ( ! isFetchingData ) {
			setIsResolvingUrl( false );

			if ( isError ) {
				setAttributes( { widgetId: undefined, goodreadsId: undefined, link: undefined } );
				setErrorNotice();
			}

			if ( goodreadsUserId && ! isError ) {
				setAttributes( { goodreadsId: goodreadsUserId } );
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ goodreadsUserId, isFetchingData, isResolvingUrl, isError, setAttributes ] );

	// Rebuild the embed link and container id whenever the block settings change,
	// minting a fresh widget id each time. Goodreads caches each widget render by
	// widget_id on first fetch and then ignores changed query params, so reusing
	// the same widget_id would leave the editor preview stuck on the first render;
	// a new widget_id busts that cache and lets the preview reflect the new
	// settings. This intentionally replaces the previous prop-identity trigger,
	// which regenerated on every render and caused an infinite refresh loop.
	//
	// The ref skips the first run for an already-configured block (goodreadsId,
	// widgetId and link all present) so simply opening a saved post does not mint
	// a new widget_id and mark the post dirty. Fresh embeds and Legacy Widget
	// transforms (goodreadsId set, no widgetId yet) fall through and generate.
	useEffect( () => {
		if ( ! goodreadsId ) {
			return;
		}

		if ( ! hasSyncedRef.current && widgetId && link ) {
			hasSyncedRef.current = true;
			return;
		}
		hasSyncedRef.current = true;

		const newWidgetId = Math.floor( Math.random() * 9999999 );
		const selector = style === 'grid' ? 'gr_grid_widget_' : 'gr_custom_widget_';
		setAttributes( {
			widgetId: newWidgetId,
			id: selector + newWidgetId,
			link: createGoodreadsEmbedLink( { attributes: { ...attributes, widgetId: newWidgetId } } ),
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		goodreadsId,
		style,
		attributes.shelfOption,
		attributes.bookNumber,
		attributes.orderOption,
		attributes.customTitle,
		attributes.sortOption,
		attributes.showAuthor,
		attributes.showCover,
		attributes.showRating,
		attributes.showReview,
		attributes.showTags,
		attributes.showTitle,
		setAttributes,
	] );

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			<>{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }</>
		);
	};

	const submitForm = event => {
		if ( event ) {
			event.preventDefault();
		}

		setUrl( userInput );
		setIsResolvingUrl( true );
	};

	const renderLoading = () => {
		return (
			<div className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Embedding…', 'jetpack' ) }</p>
			</div>
		);
	};

	const renderEditEmbed = () => {
		return (
			<div className={ className }>
				<Placeholder
					label={ __( 'Goodreads', 'jetpack' ) }
					instructions={ __( 'Paste a link to a Goodreads profile.', 'jetpack' ) }
					icon={ getBlockIconComponent( metadata ) }
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

	const renderInlinePreview = () => {
		const { id } = attributes;

		const html = `
		<style> [class^=gr_custom_container_] { border: 1px solid gray; border-radius: 10px; margin: auto; padding: 0 5px 10px 5px; background-color: #fff; color: #000; width: 300px; }  [class^=gr_custom_header_] { border-bottom: 1px solid gray; width: 100%; padding: 10px 0; margin: auto; text-align: center; font-size: 120%; }  [class^=gr_custom_each_container_] { width: 100%; clear: both; margin: auto; overflow: auto; padding-bottom: 4px; border-bottom: 1px solid #aaa; }  [class^=gr_custom_each_container_] { width: 100%; clear: both; margin-bottom: 10px; overflow: auto; padding-bottom: 4px; border-bottom: 1px solid #aaa; }  [class^=gr_custom_book_container_] { overflow: hidden; height: 60px; float: left; margin-right: 6px; width: 39px; }  [class^=gr_custom_author_] { font-size: 10px; }  [class^=gr_custom_tags_] { font-size: 10px; color: gray; }  [class^=gr_custom_rating_] { float: right; }  [class^=gr_grid_book_container] { float: left; width: 98px; height: 160px; padding: 0 0; overflow: hidden; }  [class^=gr_grid_book_container] img { height: 100%; width: 100%; }  a { text-decoration: none; }  a:hover { text-decoration: underline; }  img { max-width: 100%; }</style>
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

	let content;

	if ( isResolvingUrl ) {
		content = renderLoading();
	} else if ( attributes.goodreadsId ) {
		content = (
			<>
				<InspectorControls>
					<GoodreadsInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
				</InspectorControls>

				<BlockControls>
					<GoodreadsBlockControls attributes={ attributes } setAttributes={ setAttributes } />
				</BlockControls>

				{ renderInlinePreview() }
			</>
		);
	} else {
		content = renderEditEmbed();
	}

	return <div { ...blockProps }>{ content }</div>;
};

export default withNotices( GoodreadsEdit );
