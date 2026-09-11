import { __ } from '@wordpress/i18n';
import { Button, Link, Stack, Text } from '@wordpress/ui';
import { formatMetric, formatRate } from '../helpers/format-metric';
import './style.scss';

export type RecentPost = {
	id: number;
	title: string;
	status: 'publish' | 'draft';
	date: string;
	url: string;
	image: string | null;
	recipients: number | null;
	openRatePercent: number | null;
	clickRatePercent: number | null;
};

type Props = {
	posts: RecentPost[];
	viewAllUrl: string;
	createPostUrl: string;
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
};

const formatDate = ( date: string ): string =>
	new Intl.DateTimeFormat( undefined, { dateStyle: 'medium' } ).format( new Date( date ) );

type RecentPostsContentProps = Pick<
	Props,
	'posts' | 'isLoading' | 'isError' | 'createPostUrl' | 'onRetry'
>;

/**
 * Render the loading, error, empty, or table state for the recent posts list.
 *
 * @param props               - Content props.
 * @param props.posts         - Recent posts to display.
 * @param props.isLoading     - Whether posts are loading.
 * @param props.isError       - Whether loading posts failed.
 * @param props.createPostUrl - URL for creating a post.
 * @param props.onRetry       - Retry the posts request.
 * @return The content for the current state.
 */
function getRecentPostsContent( {
	posts,
	isLoading,
	isError,
	createPostUrl,
	onRetry,
}: RecentPostsContentProps ): JSX.Element {
	if ( isLoading ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				gap="md"
				className="jetpack-newsletter-recent-posts__state"
			>
				{ __( 'Loading recent posts…', 'jetpack-newsletter' ) }
			</Stack>
		);
	}

	if ( isError ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				gap="md"
				className="jetpack-newsletter-recent-posts__state"
			>
				<Text render={ <p /> }>
					{ __( 'Recent posts could not be loaded.', 'jetpack-newsletter' ) }
				</Text>
				<Button onClick={ onRetry }>{ __( 'Retry', 'jetpack-newsletter' ) }</Button>
			</Stack>
		);
	}

	if ( posts.length === 0 ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				gap="md"
				className="jetpack-newsletter-recent-posts__state"
			>
				<Text render={ <p /> }>{ __( 'No posts yet.', 'jetpack-newsletter' ) }</Text>
				<Link href={ createPostUrl }>{ __( 'Create a post', 'jetpack-newsletter' ) }</Link>
			</Stack>
		);
	}

	return (
		<div className="jetpack-newsletter-recent-posts__table-wrapper">
			<table className="jetpack-newsletter-recent-posts__table">
				<thead>
					<tr>
						<th scope="col">{ __( 'Post', 'jetpack-newsletter' ) }</th>
						<th scope="col">{ __( 'Status', 'jetpack-newsletter' ) }</th>
						<th scope="col">{ __( 'Recipients', 'jetpack-newsletter' ) }</th>
						<th scope="col">{ __( 'Opens', 'jetpack-newsletter' ) }</th>
						<th scope="col">{ __( 'Clicks', 'jetpack-newsletter' ) }</th>
					</tr>
				</thead>
				<tbody>
					{ posts.map( post => (
						<tr key={ post.id }>
							<td>
								<Link
									className="jetpack-newsletter-recent-posts__link"
									href={ post.url }
									aria-label={ post.title }
									variant="unstyled"
								>
									{ post.image ? (
										<img
											className="jetpack-newsletter-recent-posts__thumbnail"
											src={ post.image }
											alt=""
											data-testid="post-image"
										/>
									) : (
										<span
											className="jetpack-newsletter-recent-posts__placeholder"
											aria-hidden="true"
											data-testid="post-image-placeholder"
										/>
									) }
									<Stack
										direction="column"
										gap="xs"
										render={ <span /> }
										className="jetpack-newsletter-recent-posts__details"
									>
										<strong>{ post.title }</strong>
										{ post.status === 'publish' ? <span>{ formatDate( post.date ) }</span> : null }
									</Stack>
								</Link>
							</td>
							<td>
								<span className="jetpack-newsletter-recent-posts__status">
									{ post.status === 'publish'
										? __( 'Published', 'jetpack-newsletter' )
										: __( 'Draft', 'jetpack-newsletter' ) }
								</span>
							</td>
							<td className="jetpack-newsletter-recent-posts__metric">
								{ formatMetric( post.recipients ) }
							</td>
							<td className="jetpack-newsletter-recent-posts__metric">
								{ formatRate( post.openRatePercent ) }
							</td>
							<td className="jetpack-newsletter-recent-posts__metric">
								{ formatRate( post.clickRatePercent ) }
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
}

/**
 * Render the recent Newsletter posts and their email metrics.
 *
 * @param props               - Component props.
 * @param props.posts         - Recent posts to display.
 * @param props.viewAllUrl    - URL for the posts list.
 * @param props.createPostUrl - URL for creating a post.
 * @param props.isLoading     - Whether posts are loading.
 * @param props.isError       - Whether loading posts failed.
 * @param props.onRetry       - Retry the posts request.
 * @return Recent posts card.
 */
export default function RecentPosts( {
	posts,
	viewAllUrl,
	createPostUrl,
	isLoading,
	isError,
	onRetry,
}: Props ): JSX.Element {
	const content = getRecentPostsContent( { posts, isLoading, isError, createPostUrl, onRetry } );

	return (
		<section className="jetpack-newsletter-recent-posts">
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className="jetpack-newsletter-recent-posts__header"
			>
				<Text render={ <h3 /> } variant="heading-lg">
					{ __( 'Recent Posts', 'jetpack-newsletter' ) }
				</Text>
				{ viewAllUrl ? (
					<Link href={ viewAllUrl } tone="neutral">
						{ __( 'View all', 'jetpack-newsletter' ) }
					</Link>
				) : null }
			</Stack>
			{ content }
		</section>
	);
}
