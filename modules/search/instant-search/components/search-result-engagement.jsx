/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import { formatDateString } from '../lib/date';
import { capitalize } from '../lib/strings';
import SearchResultComments from './search-result-comments';
import PhotonImage from './photon-image';
import Gridicon from './gridicon';

function formatPostTypeHeader( postType ) {
	// jetpack_support -> Jetpack Support
	return postType
		.split( '_' )
		.map( capitalize )
		.join( ' ' );
}

function getGridiconName( postType ) {
	if ( postType === 'post' || postType === 'page' ) {
		return `${ postType }s`;
	}
	return 'image';
}

function getPostTypeIcon( postType ) {
	return <Gridicon icon={ getGridiconName( postType ) } size={ 32 } />;
}

export default function SearchResultEngagement( props ) {
	const { result_type, fields, highlight } = props.result;

	if ( result_type !== 'post' ) {
		return null;
	}

	const firstImage = Array.isArray( fields[ 'image.url.raw' ] )
		? fields[ 'image.url.raw' ][ 0 ]
		: fields[ 'image.url.raw' ];
	return (
		<li className="jetpack-instant-search__search-result-engagement">
			<div className="jetpack-instant-search__search-result-engagement__image-container">
				<a
					className="jetpack-instant-search__result-engagement__image-link"
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					onClick={ props.onClick }
					rel="noopener noreferrer"
					target="_blank"
				>
					{ firstImage ? (
						<PhotonImage
							alt=""
							className="jetpack-instant-search__search-result-engagement__image"
							src={ `//${ firstImage }` }
							useDiv
						/>
					) : (
						<div className="jetpack-instant-search__search-result-engagement__image-placeholder">
							{ getPostTypeIcon( fields.post_type ) }
						</div>
					) }
				</a>
			</div>

			<div className="jetpack-instant-search__search-result-engagement__copy-container">
				<div className="jetpack-instant-search__search-result-engagement__type-and-date">
					<span className="jetpack-instant-search__search-result-engagement__post-type">
						{ formatPostTypeHeader( fields.post_type ) }
					</span>{ ' ' }
					<span className="jetpack-instant-search__search-result-engagement__date">
						{ formatDateString( fields.date ) }
					</span>
				</div>
				<h3 className="jetpack-instant-search__search-result-engagement__title">
					<a
						className="jetpack-instant-search__result-engagement__title-link"
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ props.onClick }
						rel="noopener noreferrer"
						target="_blank"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
					/>
				</h3>

				<div
					className="jetpack-instant-search__search-result-engagement__content"
					//eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: highlight.content.join( ' ... ' ),
					} }
				/>

				{ highlight.comments && <SearchResultComments comments={ highlight.comments } /> }
			</div>
		</li>
	);
}
