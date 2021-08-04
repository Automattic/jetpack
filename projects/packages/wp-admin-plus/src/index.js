/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { render, Fragment } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { dateI18n, __experimentalGetSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import './style.scss';

const PostList = ( { type = 'post ' } ) => {
	const posts = useSelect( select => select( coreStore ).getEntityRecords( 'postType', type ), [] );

	if ( ! posts?.length ) {
		return null;
	}

	const dateFormat = __experimentalGetSettings().formats.date;

	return (
		<Fragment>
			<thead>
				<tr>
					<th>{ __( 'Title', 'automattic/jetpack-wp-admin-plus' ) }</th>
					<th>{ __( 'Author', 'automattic/jetpack-wp-admin-plus' ) }</th>
					<th>{ __( 'Date', 'automattic/jetpack-wp-admin-plus' ) }</th>
				</tr>
			</thead>

			<tbody>
				{ posts.map( post => {
					return (
						<tr key={ post.id }>
							<td>{ post?.title.raw }</td>
							<td>{ post.author }</td>
							<td>{ dateI18n( dateFormat, post.date_gmt ) }</td>
						</tr>
					);
				} ) }
			</tbody>
		</Fragment>
	);
};

domReady( () => {
	const tableContainer = document.querySelector( '.wp-list-table' );
	if ( ! tableContainer ) {
		return;
	}

	render( <PostList type={ Jetpack_WPAdmin_Plus?.postType } />, tableContainer );
} );
