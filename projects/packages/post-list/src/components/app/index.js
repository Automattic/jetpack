/**
 * External dependencies
 */
import FeaturedImage from '../featured-image';

export default function App( { posts } ) {
	if ( ! posts?.length ) {
		return null;
	}

	return (
		<div className="post-list-app-wrapper">
			{ posts.map( post => {
				return (
					<FeaturedImage
						key={ `post-${ post.id }` }
						{ ...post?.featured_image }
						rootEl={ post.rootEl }
					/>
				);
			} ) }
		</div>
	);
}
