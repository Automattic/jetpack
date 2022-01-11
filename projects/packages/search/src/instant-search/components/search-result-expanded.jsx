/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import PathBreadcrumbs from './path-breadcrumbs';
import PhotonImage from './photon-image';
import SearchResultComments from './search-result-comments';
import { fixDateFormat } from './search-filter';
import './search-result-expanded.scss';

/**
 * Functional component for expanded search results.
 *
 * @param {object} props - Component properties.
 * @returns {Element} - Expanded search result component.
 */
export default function SearchResultExpanded( props ) {
	const { isMultiSite, locale = 'en-US' } = props;
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
				'jetpack-instant-search__search-result-expanded',
				`jetpack-instant-search__search-result-expanded--${ fields.post_type }`,
				! firstImage ? 'jetpack-instant-search__search-result-expanded--no-image' : '',
				isMultiSite ? 'is-multisite' : '',
			].join( ' ' ) }
		>
			<div className="jetpack-instant-search__search-result-expanded__content-container">
				<div className="jetpack-instant-search__search-result-expanded__copy-container">
					<h3 className="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-expanded__title">
						<a
							className="jetpack-instant-search__search-result-title-link jetpack-instant-search__search-result-expanded__title-link"
							href={ `//${ fields[ 'permalink.url.raw' ] }` }
							onClick={ props.onClick }
							//eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={ { __html: highlight.title } }
						/>
					</h3>

					{ ! isMultiSite && (
						<PathBreadcrumbs
							className="jetpack-instant-search__search-result-expanded__path"
							onClick={ props.onClick }
							url={ `//${ fields[ 'permalink.url.raw' ] }` }
						/>
					) }

					<div
						className="jetpack-instant-search__search-result-expanded__content"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: highlight.content.join( ' ... ' ),
						} }
					/>

					{ highlight.comments && <SearchResultComments comments={ highlight.comments } /> }
				</div>
				<a
					className="jetpack-instant-search__search-result-expanded__image-link"
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					onClick={ props.onClick }
				>
					<div className="jetpack-instant-search__search-result-expanded__image-container">
						{ firstImage ? (
							<PhotonImage
								alt={ fields[ 'title.default' ] }
								className="jetpack-instant-search__search-result-expanded__image"
								isPhotonEnabled={ props.isPhotonEnabled }
								src={ `//${ firstImage }` }
							/>
						) : null }
					</div>
				</a>
			</div>
			{ isMultiSite && (
				<ul className="jetpack-instant-search__search-result-expanded__footer">
					<li>
						<PhotonImage
							alt={ fields.blog_name }
							className="jetpack-instant-search__search-result-expanded__footer-blog-image"
							isPhotonEnabled={ false }
							height={ 24 }
							width={ 24 }
							src={ fields.blog_icon_url }
							lazyLoad={ false }
						/>
						<span className="jetpack-instant-search__search-result-expanded__footer-blog">
							{ fields.blog_name }
						</span>
					</li>
					<li>
						<span className="jetpack-instant-search__search-result-expanded__footer-author">
							{ fields.author }
						</span>
					</li>
					<li>
						<span className="jetpack-instant-search__search-result-expanded__footer-date">
							{ new Date( fixDateFormat( fields.date ) ).toLocaleDateString( locale, {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
							} ) }
						</span>
					</li>
				</ul>
			) }
		</li>
	);
}
