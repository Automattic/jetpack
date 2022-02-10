/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { createRef, useState, useEffect } from '@wordpress/element';
import { Placeholder } from '@wordpress/components';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { icon, title } from './';
import { getUrl, getSelectedGiphyAttributes } from './utils';
import SearchForm from './components/search-form';
import Controls from './controls';
import useFetchGiphyData from './hooks/use-fetch-giphy-data';

function GifEdit( { attributes, setAttributes, className, isSelected } ) {
	const { align, caption, giphyUrl, searchText, paddingTop } = attributes;
	const classes = classNames( className, `align${ align }` );
	const [ captionFocus, setCaptionFocus ] = useState( false );
	const searchFormInputRef = createRef();
	const { isFetching, giphyData, fetchGiphyData } = useFetchGiphyData();

	const setSearchInputFocus = () => {
		searchFormInputRef.current.focus();
		setCaptionFocus( false );
	};

	useEffect( () => {
		if ( giphyData && giphyData[ 0 ] ) {
			setAttributes( getSelectedGiphyAttributes( giphyData[ 0 ] ) );
		}
	}, [ giphyData, setAttributes ] );

	const onSubmit = event => {
		event.preventDefault();

		if ( ! attributes.searchText || isFetching ) {
			return;
		}

		fetchGiphyData( getUrl( attributes.searchText ) );
	};

	const onChange = event => setAttributes( { searchText: event.target.value } );
	const onSelectThumbnail = thumbnail => setAttributes( getSelectedGiphyAttributes( thumbnail ) );

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
					{ isSelected && giphyData && giphyData.length > 1 && (
						<div className="wp-block-jetpack-gif_thumbnails-container">
							{ giphyData.map( thumbnail => {
								const thumbnailStyle = {
									backgroundImage: `url(${ thumbnail.images.downsized_still.url })`,
								};
								return (
									<button
										className="wp-block-jetpack-gif_thumbnail-container"
										key={ thumbnail.id }
										onClick={ e => {
											e.preventDefault();
											onSelectThumbnail( thumbnail );
										} }
										style={ thumbnailStyle }
									/>
								);
							} ) }
						</div>
					) }
					<div className="wp-block-jetpack-gif-wrapper" style={ { paddingTop } }>
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
