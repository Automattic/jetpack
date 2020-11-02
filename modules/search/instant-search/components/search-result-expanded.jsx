/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import PathBreadcrumbs from './path-breadcrumbs';
import PhotonImage from './photon-image';
import SearchResultComments from './search-result-comments';
import './search-result-expanded.scss';

export default function SearchResultExpanded( props ) {
	const { result_type, fields, highlight } = props.result;

	if ( result_type !== 'post' ) {
		return null;
	}

	const firstImage = Array.isArray( fields[ 'image.url.raw' ] )
		? fields[ 'image.url.raw' ][ 0 ]
		: fields[ 'image.url.raw' ];
	return (
		<li
			className={ `jetpack-instant-search__result-expanded 
			jetpack-instant-search__result-expanded--${ fields.post_type }
			${ ! firstImage ? 'jetpack-instant-search__result-expanded--no-image' : '' }` }
		>
			<div className="jetpack-instant-search__result-expanded__copy-container">
				<h3 className="jetpack-instant-search__result-expanded__title">
					<a
						className="jetpack-instant-search__result-expanded__title-link"
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ props.onClick }
						rel="noopener noreferrer"
						target="_blank"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
					/>
				</h3>
				<PathBreadcrumbs
					className="jetpack-instant-search__result-expanded__path"
					onClick={ props.onClick }
					url={ `//${ fields[ 'permalink.url.raw' ] }` }
				/>
				<div
					className="jetpack-instant-search__result-expanded__content"
					//eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: highlight.content.join( ' ... ' ),
					} }
				/>

				{ highlight.comments && <SearchResultComments comments={ highlight.comments } /> }
			</div>
			<div className="jetpack-instant-search__result-expanded__image-container">
				<a
					className="jetpack-instant-search__result-expanded__image-link"
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					onClick={ props.onClick }
					rel="noopener noreferrer"
					target="_blank"
				>
					{ firstImage ? (
						// NOTE: Wouldn't it be amazing if we filled the container's background
						//       with the primary color of the image?
						<PhotonImage
							alt=""
							className="jetpack-instant-search__result-expanded__image"
							isPrivateSite={ this.props.isPrivateSite }
							src={ `//${ firstImage }` }
							useDiv
						/>
					) : null }
				</a>
			</div>
		</li>
	);
}
