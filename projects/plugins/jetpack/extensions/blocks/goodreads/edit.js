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
	const prevPropsRef = useRef( null );
	const blockProps = useBlockProps();

	const { isFetchingData, goodreadsUserId, isError } = useFetchGoodreadsData( url );

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

			// Applies when transforming from Legacy Widget,
			// in which case goodreadsId is already known.
			if ( attributes.goodreadsId ) {
				setRequestLink();
			}

			if ( goodreadsUserId && ! isError ) {
				setAttributes( { goodreadsId: goodreadsUserId } );
				setRequestLink();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ goodreadsUserId, isFetchingData, isResolvingUrl, isError, setAttributes ] );

	useEffect( () => {
		if (
			prevPropsRef.current &&
			attributes.goodreadsId &&
			attributes.widgetId === prevPropsRef.current.attributes.widgetId
		) {
			setRequestLink();
		}
		prevPropsRef.current = props;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ props, attributes.goodreadsId, attributes.widgetId ] );

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			<>{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }</>
		);
	};

	const setRequestLink = () => {
		const selector = attributes.style === 'grid' ? 'gr_grid_widget_' : 'gr_custom_widget_';
		setAttributes( {
			widgetId: Math.floor( Math.random() * 9999999 ),
			link: createGoodreadsEmbedLink( { attributes } ),
			id: selector + attributes.widgetId,
		} );
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
		const { link, id } = attributes;

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
