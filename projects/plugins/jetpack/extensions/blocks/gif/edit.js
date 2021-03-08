/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { createRef, useState, useEffect, useCallback } from '@wordpress/element';
import { Placeholder } from '@wordpress/components';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { icon, title } from './';
import { getUrl, getPaddingTop, getEmbedUrl } from './utils';
import SearchForm from './components/search-form';
import Controls from './controls';

function GifEdit( {
	attributes,
	setAttributes,
	className,
	isSelected,
} ) {
	const { align, caption, giphyUrl, searchText, paddingTop } = attributes;
	const classes = classNames( className, `align${ align }` );
	const [ captionFocus, setCaptionFocus ] = useState( false );
	const [ results, setResults ] = useState( '' );
	const searchFormInputRef = createRef();

	const setSelectedGiphy = ( item ) => {
		setAttributes( { giphyUrl: getEmbedUrl( item ), paddingTop: getPaddingTop( item ) } );
	};

	const setSearchInputFocus = () => {
		//searchFormInputRef.current.focus();
		setCaptionFocus( false );
	};

	const fetchResults = async ( requestUrl ) => {
		const giphyFetch = await fetch( requestUrl )
			.then( ( response ) => {
				if ( response.ok ) {
					return response;
				}
				return false;
			} )
			.catch( () => {
				return false;
			} );

		if ( giphyFetch ) {
			const giphyResponse = await giphyFetch.json();
			// If there is only one result, Giphy's API does not return an array.
			// The following statement normalizes the data into an array with one member in this case.
			const giphyResults = typeof giphyResponse.data.images !== 'undefined' ? [ giphyResponse.data ] : giphyResponse.data;

			// Try to grab the first result. We're going to show this as the main image.
			const giphyData = giphyResults[ 0 ];

			// No results
			if ( ! giphyData.images ) {
				return false;
			}

			setResults( giphyResults );
		}
	};

	useEffect( () => {
		if ( results && results[ 0 ] ) {
			setSelectedGiphy( results[ 0 ] );
		}
	}, [ results ] );

	const onSubmit = ( event ) => {
		event.preventDefault();
		fetchResults( getUrl( attributes.searchText ) );
	};

	const onChange = ( event ) => setAttributes( { searchText: event.target.value } );

	return (
		<div className={ classes }>
			<Controls />
			{ ! giphyUrl ? (
				<Placeholder
					className="wp-block-jetpack-gif_placeholder"
					icon={ icon }
					label={ title }
					instructions={ __( 'Search for a term or paste a Giphy URL', 'jetpack' ) }
				>
					<SearchForm
						onSubmit={ onSubmit }
						onChange={ onChange }
						value={ searchText }
						ref={ searchFormInputRef }
					/>
				</Placeholder>
			) : (
				<figure>
					{ isSelected && (
						<SearchForm
							onSubmit={ onSubmit }
							onChange={ onChange }
							value={ searchText }
							ref={ searchFormInputRef }
						/>
					) }
					{ isSelected && results && results.length > 1 && (
						<div className="wp-block-jetpack-gif_thumbnails-container">
							{ results.map( thumbnail => {
								const thumbnailStyle = {
									backgroundImage: `url(${ thumbnail.images.downsized_still.url })`,
								};
								return (
									<button
										className="wp-block-jetpack-gif_thumbnail-container"
										key={ thumbnail.id }
										onClick={ () => setSelectedGiphy( thumbnail ) }
										style={ thumbnailStyle }
									/>
								);
							} ) }
						</div>
					) }
					<div className="wp-block-jetpack-gif-wrapper" style={ paddingTop.style }>
						<div
							className="wp-block-jetpack-gif_cover"
							onClick={ setSearchInputFocus }
							onKeyDown={ setSearchInputFocus }
							role="button"
							tabIndex="0"
						/>
						<iframe src={ giphyUrl } title={ searchText } />
					</div>
					{ ( ! RichText.isEmpty( caption ) || isSelected ) && !! giphyUrl && (
						<RichText
							className="wp-block-jetpack-gif-caption gallery-caption"
							inlineToolbar
							isSelected={ captionFocus }
							unstableOnFocus={ () => setCaptionFocus( false ) }
							onChange={ value => setAttributes( { caption: value } ) }
							placeholder={ __( 'Write caption…', 'jetpack' ) }
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			) }
		</div>
	);
}

export default GifEdit;
