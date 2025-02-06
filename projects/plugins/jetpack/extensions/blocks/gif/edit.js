import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { createRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import metadata from './block.json';
import SearchForm from './components/search-form';
import Controls from './controls';
import useFetchGiphyData from './hooks/use-fetch-giphy-data';
import { getUrl, getSelectedGiphyAttributes } from './utils';

const icon = getBlockIconComponent( metadata );

function GifEdit( { attributes, setAttributes, isSelected } ) {
	const { align, caption, giphyUrl, searchText, paddingTop } = attributes;
	const [ captionFocus, setCaptionFocus ] = useState( false );
	const searchFormInputRef = createRef();
	const { isFetching, giphyData, fetchGiphyData } = useFetchGiphyData();
	const blockProps = useBlockProps();

	const setSearchInputFocus = () => {
		searchFormInputRef.current.focus();
		setCaptionFocus( false );
	};

	useEffect( () => {
		if ( giphyData && giphyData[ 0 ] ) {
			setAttributes( getSelectedGiphyAttributes( giphyData[ 0 ] ) );
		}
	}, [ giphyData, setAttributes ] );

	const onSubmit = async event => {
		event.preventDefault();

		if ( ! attributes.searchText || isFetching ) {
			return;
		}

		const url = await getUrl( attributes.searchText );

		if ( url ) {
			fetchGiphyData( url );
		}
	};

	const onChange = event => setAttributes( { searchText: event.target.value } );
	const onSelectThumbnail = thumbnail => setAttributes( getSelectedGiphyAttributes( thumbnail ) );

	return (
		<div { ...blockProps } className={ clsx( blockProps.className, `align${ align }` ) }>
			<Controls />
			{ ! giphyUrl ? (
				<Placeholder
					className="wp-block-jetpack-gif_placeholder"
					icon={ icon }
					label={ metadata.title }
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
							onFocus={ () => setCaptionFocus( false ) }
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
