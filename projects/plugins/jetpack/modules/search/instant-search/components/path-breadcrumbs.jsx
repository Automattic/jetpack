/**
 * External dependencies
 */
import React from 'react';

import './path-breadcrumbs.scss';

function splitDomainPath( path ) {
	const splits = path.split( '/' ).filter( piece => piece.length > 0 );
	splits.shift(); // Removes domain name from splits; e.g. 'jetpack.com'
	return splits.length === 0 ? [ '/' ] : splits;
}

const PathBreadcrumbs = ( { className, onClick, url } ) => {
	return (
		<div className={ `jetpack-instant-search__path-breadcrumb ${ className ? className : '' }` }>
			<a
				className="jetpack-instant-search__path-breadcrumb-link"
				href={ `//${ url }` }
				onClick={ onClick }
			>
				{ splitDomainPath( url ).map( ( piece, index, pieces ) => (
					<span className="jetpack-instant-search__path-breadcrumb-piece">
						{ decodeURIComponent( piece ) }
						{ index !== pieces.length - 1 ? ' › ' : '' }
					</span>
				) ) }
			</a>
		</div>
	);
};
export default PathBreadcrumbs;
