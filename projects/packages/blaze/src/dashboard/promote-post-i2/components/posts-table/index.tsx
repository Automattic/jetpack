import config from '../../../compat/config';
import '../campaigns-table/style.scss';
import { BlazablePost } from '../../../data/promote-post/types';
import { ItemsLoading, SingleItemLoading } from '../campaigns-table';
import PostItem from '../post-item';
import PostsListHeader from '../posts-list/header';

interface Props {
	posts: BlazablePost[];
	type: string;
	isLoading: boolean;
	isFetchingPageResults: boolean;
	hasPaymentsBlocked: boolean;
}

/**
 *
 * @param props
 */
export default function PostsTable( props: Props ) {
	const { posts, type, isLoading, isFetchingPageResults, hasPaymentsBlocked } = props;
	const isRunningInWooStore = config.isEnabled( 'is_running_in_woo_site' );

	return (
		<table className="promote-post-i2__table posts-lists__table">
			<PostsListHeader type={ isRunningInWooStore && type === 'product' ? type : 'post' } />
			<tbody>
				{ isLoading && ! isFetchingPageResults ? (
					<ItemsLoading />
				) : (
					<>
						{ posts.map( ( post: BlazablePost ) => {
							return (
								<PostItem
									key={ `post-id${ post.ID }` }
									post={ post }
									filterType={ type }
									hasPaymentsBlocked={ hasPaymentsBlocked }
								/>
							);
						} ) }
						{ isFetchingPageResults && <SingleItemLoading /> }
					</>
				) }
			</tbody>
		</table>
	);
}
