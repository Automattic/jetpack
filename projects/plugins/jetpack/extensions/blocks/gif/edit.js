import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { createRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import metadata from './block.json';
import SearchForm from './components/search-form';
import Controls from './controls';
import useFetchTumblrData from './hooks/use-fetch-tumblr-data';
import { getSelectedGifAttributes, getUrl } from './utils';

const icon = getBlockIconComponent( metadata );

function GifEdit( { attributes, setAttributes, isSelected } ) {
	const {
		align,
		caption,
		gifUrl,
		giphyUrl,
		searchText,
		paddingTop,
		attributionUrl,
		attributionName,
	} = attributes;
	const [ captionFocus, setCaptionFocus ] = useState( false );
	const searchFormInputRef = createRef();
	const { isFetching, tumblrData, fetchTumblrData } = useFetchTumblrData();
	const blockProps = useBlockProps();

	const setSearchInputFocus = () => {
		searchFormInputRef.current.focus();
		setCaptionFocus( false );
	};

	useEffect( () => {
		if ( tumblrData && tumblrData[ 0 ] ) {
			setAttributes( getSelectedGifAttributes( tumblrData[ 0 ] ) );
		}
	}, [ tumblrData, setAttributes ] );

	const onSubmit = async event => {
		event.preventDefault();

		if ( ! attributes.searchText || isFetching ) {
			return;
		}

		const url = await getUrl( attributes.searchText );

		if ( url ) {
			fetchTumblrData( url );
		}
	};

	const onChange = event => setAttributes( { searchText: event.target.value } );
	const onSelectThumbnail = thumbnail => setAttributes( getSelectedGifAttributes( thumbnail ) );

	return (
		<div { ...blockProps } className={ clsx( blockProps.className, `align${ align }` ) }>
			<Controls />
			{ ! gifUrl && ! giphyUrl ? (
				<Placeholder
					className="wp-block-jetpack-gif_placeholder"
					icon={ icon }
					label={ metadata.title }
					instructions={ __( 'Search for a term or paste a Tumblr GIF URL', 'jetpack' ) }
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
					{ isSelected && tumblrData && tumblrData.length > 1 && (
						<div className="wp-block-jetpack-gif_thumbnails-container">
							{ tumblrData.map( thumbnail => {
								const thumbnailStyle = {
									backgroundImage: `url(${ thumbnail.media[ 0 ].poster.url })`,
								};
								return (
									<button
										className="wp-block-jetpack-gif_thumbnail-container"
										key={ thumbnail.media_key }
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
						{ giphyUrl ? (
							<iframe src={ giphyUrl } title={ searchText } />
						) : (
							<img src={ gifUrl } alt={ searchText } />
						) }
					</div>
					{ attributionUrl && gifUrl && ! giphyUrl && (
						<figcaption className="wp-block-jetpack-gif-attribution">
							<a href={ attributionUrl } target="_blank" rel="noopener noreferrer">
								{ `GIF by ${ attributionName } on Tumblr` }
							</a>
						</figcaption>
					) }
					{ ( ! RichText.isEmpty( caption ) || isSelected ) && ( !! gifUrl || !! giphyUrl ) && (
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
