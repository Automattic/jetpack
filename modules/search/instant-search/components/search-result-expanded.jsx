/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultComments from './search-result-comments';
import PhotonImage from './photon-image';
import Gridicon from './gridicon';

function getGridiconName( postType ) {
	if ( postType === 'post' || postType === 'page' ) {
		return `${ postType }s`;
	}
	return 'image';
}

function getPostTypeIcon( postType ) {
	return <Gridicon icon={ getGridiconName( postType ) } size={ 32 } />;
}

function splitDomainPath( path ) {
	const splits = path.split( '/' ).filter( piece => piece.length > 0 );
	splits.shift(); // Removes domain name from splits; e.g. 'jetpack.com'
	return splits;
}

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
				<div className="jetpack-instant-search__result-expanded__path">
					<a
						className="jetpack-instant-search__result-expanded__path-link"
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ props.onClick }
						rel="noopener noreferrer"
						target="_blank"
					>
						{ splitDomainPath( fields[ 'permalink.url.raw' ] ).map( ( piece, index, pieces ) => (
							<span className="jetpack-instant-search__result-expanded__path-piece">
								{ piece }
								{ index !== pieces.length - 1 ? ' › ' : '' }
							</span>
						) ) }
					</a>
				</div>

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
							src={ `//${ firstImage }` }
							useDiv
						/>
					) : null }
				</a>
			</div>
		</li>
	);
}
