/** @jsx h */

/**
 * Internal  dependencies
 */
import resizeImageUrl from '../lib/resize-image-url';

/**
 * External dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { h, Component } from 'preact';
import strip from 'strip';

const CONTENT_WIDTH = 800,
	PHOTO_ONLY_MIN_WIDTH = 440,
	PHOTO_ONLY_MAX_CHAR_COUNT = 85,
	GALLERY_MIN_IMAGES = 4,
	GALLERY_MIN_IMAGE_WIDTH = 300,
	MIN_IMAGE_WIDTH = 144,
	MIN_IMAGE_HEIGHT = 72,
	WORDS_PER_MINUTE = 250;

class SearchResultEngagement extends Component {
	cssSafeUrl( url ) {
		return url && url.replace( /([\(\)])/g, '\\$1' );
	}

	renderEngagement() {
		//TODO: implement from: https://github.com/Automattic/wp-calypso/blob/df8fe9e82dae71d8df9b78fe7a725e04e4067311/client/blocks/reader-post-actions/index.jsx
		//comments, likes, reading time
	}

	render() {
		return null;
		const { result_type, fields, highlight } = this.props.result;
		if ( result_type !== 'post' ) {
			return null;
		}
		const word_count = fields.content.default.word_count; //Fix for multi-lingual

		const isPhotoPost = fields.has.image == 1 && word_count > PHOTO_ONLY_MAX_CHAR_COUNT;
		const isGalleryPost = fields.has.gallery > 1 && fields.has.image > GALLERY_MIN_IMAGES;
		const isWPVideo = fields.has.wpvideo > 1;
		const isYouTube = fields.has.youtube > 1;

		let classes = 'jetpack-instant-search__result-eng';
		classes += isPhotoPost ? ' jetpack-instant-search__photo' : '';
		classes += isGalleryPost ? ' jetpack-instant-search__gallery' : '';

		let card;
		if ( isPhotoPost ) {
			//TODO: implement based on https://github.com/Automattic/wp-calypso/blob/df8fe9e82dae71d8df9b78fe7a725e04e4067311/client/blocks/reader-post-card/photo.jsx
		} else if ( isGalleryPost ) {
			//TODO: debug based on https://github.com/Automattic/wp-calypso/blob/df8fe9e82dae71d8df9b78fe7a725e04e4067311/client/blocks/reader-post-card/gallery.jsx
			const imagesToDisplay = fields.image.url;
			const listItems = imagesToDisplay.map( ( image, index ) => {
				const imageUrl = resizeImageUrl( image.src, {
					w: CONTENT_WIDTH / imagesToDisplay.length,
				} );
				const safeCssUrl = this.cssSafeUrl( imageUrl );
				const imageStyle = {
					backgroundImage: 'url(' + safeCssUrl + ')',
					backgroundSize: 'cover',
					backgroundPosition: '50% 50%',
					backgroundRepeat: 'no-repeat',
				};
				return (
					<li
						key={ `post-${ post.ID }-image-${ index }` }
						className="jetpack-instant-search__gallery-item"
					>
						<div className="jetpack-instant-search__gallery-image" style={ imageStyle } />
					</li>
				);
			} );
			const additional_images = fields.as.image - GALLERY_MIN_IMAGES;

			return (
				<div className={ classes }>
					<ul className="jetpack-instant-search__result-eng-gallery">{ listItems }</ul>
					<div className="jetpack-instant-search__result-eng-details">
						<h3>
							<a
								href={ `//${ this.props.result.fields[ 'permalink.url.raw' ] }` }
								target="_blank"
								rel="noopener noreferrer"
								className="jetpack-instant-search__result-eng-title"
								dangerouslySetInnerHTML={ { __html: this.props.result.highlight.title } }
							/>
						</h3>
						<div
							className="jetpack-instant-search__result-eng-content"
							dangerouslySetInnerHTML={ {
								__html: highlight.content.join( ' ... ' ),
							} }
						/>
						{ additional_images > 0 && (
							<div className="jetpack-instant-search__result-eng-img-count">
								{ sprintf( '$d more images', additional_images ) }
							</div>
						) }
					</div>
				</div>
			);
		}

		let featuredAsset = null;
		if ( fields.has.video ) {
			//TODO: implement based on https://github.com/Automattic/wp-calypso/blob/59bdfeeb97eda4266ad39410cb0a074d2c88dbc8/client/blocks/reader-featured-video/index.jsx
		} else if ( fields.image.url.raw ) {
			//TODO: implement based on https://github.com/Automattic/wp-calypso/blob/59bdfeeb97eda4266ad39410cb0a074d2c88dbc8/client/blocks/reader-featured-image/index.jsx
		}

		//Based on https://github.com/Automattic/wp-calypso/blob/df8fe9e82dae71d8df9b78fe7a725e04e4067311/client/blocks/reader-post-card/standard.jsx
		return (
			<div className={ classes }>
				{ featuredAsset }
				<div className="jetpack-instant-search__result-eng-details">
					<h3>
						<a
							href={ `//${ this.props.result.fields[ 'permalink.url.raw' ] }` }
							target="_blank"
							rel="noopener noreferrer"
							className="jetpack-instant-search__result-eng-title"
							dangerouslySetInnerHTML={ { __html: this.props.result.highlight.title } }
						/>
					</h3>
					<div
						className="jetpack-instant-search__result-eng-content"
						dangerouslySetInnerHTML={ {
							__html: highlight.content.join( ' ... ' ),
						} }
					/>
					<div className="jetpack-instant-search__result-eng-reading-time">
						{ sprintf( '$d min read', Math.ceil( word_count / WORDS_PER_MINUTE ) ) }
					</div>
				</div>
			</div>
		);
	}
}

export default SearchResultEngagement;
