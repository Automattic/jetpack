import { __ } from '@wordpress/i18n';

type PostsListHeaderColumn = {
	id: string;
	title: string | null;
};

type PostsListHeaderProps = {
	type: 'product' | 'post' | 'page';
};

/**
 *
 * @param root0
 * @param root0.type
 */
export default function PostsListHeader( { type }: PostsListHeaderProps ) {
	const getHeaderColumns = (): Array< PostsListHeaderColumn > => {
		const columns: Array< PostsListHeaderColumn > = [
			{
				id: 'data',
				title: __( 'Post', 'jetpack-blaze' ),
			},
			{
				id: 'type',
				title: __( 'Type', 'jetpack-blaze' ),
			},
		];

		if ( type === 'product' ) {
			columns.push(
				{
					id: 'sku',
					title: __( 'SKU', 'jetpack-blaze' ),
				},
				{
					id: 'price',
					title: __( 'Price', 'jetpack-blaze' ),
				}
			);
		}

		columns.push( {
			id: 'publish-date',
			title: __( 'Publish date', 'jetpack-blaze' ),
		} );

		columns.push( {
			id: 'views',
			title: __( 'Visitors', 'jetpack-blaze' ),
		} );

		if ( type === 'post' || type === 'page' ) {
			columns.push(
				{
					id: 'likes',
					title: __( 'Likes', 'jetpack-blaze' ),
				},
				{
					id: 'comments',
					title: __( 'Comments', 'jetpack-blaze' ),
				}
			);
		}

		columns.push(
			{
				id: 'view',
				title: null,
			},
			{
				id: 'promote',
				title: null,
			}
		);

		return columns;
	};

	return (
		<thead className="posts-list__header">
			<tr>
				{ getHeaderColumns().map( item => (
					<th
						key={ item.id }
						className={ `posts-list__header-column post-item__post-${ item.id }` }
					>
						{ item.title }
					</th>
				) ) }
			</tr>
		</thead>
	);
}
