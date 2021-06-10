/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import PhotonImage from './photon-image';
import SearchResultComments from './search-result-comments';
import './search-result-multisite.scss';
import { getDateString } from '../lib/date';

/**
 * Multi site search results
 *
 * @param {object} props - Given search results component properties
 * @returns {Element|null} - multi site search results component
 */
export default function SearchResultMultiSite( props ) {
	const { result_type, fields, highlight } = props.result;

	if ( result_type !== 'post' ) {
		return null;
	}

	const firstImage = Array.isArray( fields[ 'image.url.raw' ] )
		? fields[ 'image.url.raw' ][ 0 ]
		: fields[ 'image.url.raw' ];
	return (
		<li
			className={ [
				'jetpack-instant-search__search-result',
				'jetpack-instant-search__search-result-multisite',
				`jetpack-instant-search__search-result-multisite--${ fields.post_type }`,
				! firstImage ? 'jetpack-instant-search__search-result-multisite--no-image' : '',
			].join( ' ' ) }
		>
			<div className="jetpack-instant-search__search-result-multisite__content-container">
				<div className="jetpack-instant-search__search-result-multisite__copy-container">
					<h3 className="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-multisite__title">
						<a
							className="jetpack-instant-search__search-result-title-link jetpack-instant-search__search-result-multisite__title-link"
							href={ `//${ fields[ 'permalink.url.raw' ] }` }
							onClick={ props.onClick }
							//eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={ { __html: highlight.title } }
						/>
					</h3>
					<div
						className="jetpack-instant-search__search-result-multisite__content"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: highlight.content.join( ' ... ' ),
						} }
					/>

					{ highlight.comments && <SearchResultComments comments={ highlight.comments } /> }
				</div>
				<a
					className="jetpack-instant-search__search-result-multisite__image-link"
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					onClick={ props.onClick }
				>
					<div className="jetpack-instant-search__search-result-multisite__image-container">
						{ firstImage ? (
							// NOTE: Wouldn't it be amazing if we filled the container's background
							//       with the primary color of the image?
							<PhotonImage
								alt={ highlight.title }
								className="jetpack-instant-search__search-result-multisite__image"
								isPhotonEnabled={ this.props.isPhotonEnabled }
								src={ `//${ firstImage }` }
							/>
						) : null }
					</div>
				</a>
			</div>
			<ul className="jetpack-instant-search__search-result-multisite__footer">
				<li>
					<PhotonImage
						alt={ fields.blog_name }
						className="jetpack-instant-search__search-result-multisite__footer-blog-image"
						isPhotonEnabled={ false }
						height={ 24 }
						width={ 24 }
						src={ fields.blog_icon_url }
						lazyLoad={ false }
					/>
					<span className="jetpack-instant-search__search-result-multisite__footer-blog">
						{ fields.blog_name }
					</span>
				</li>
				<li>
					<span className="jetpack-instant-search__search-result-multisite__footer-author">
						{ fields.author }
					</span>
				</li>
				<li>
					<span className="jetpack-instant-search__search-result-multisite__footer-date">
						{ getDateString( fields.date ) }
					</span>
				</li>
			</ul>
		</li>
	);
}
