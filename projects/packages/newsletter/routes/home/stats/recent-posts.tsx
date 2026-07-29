import { DataViews, type Field, type View } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Text } from '@wordpress/ui';
import { getNewsletterModeScriptData } from '../../../src/settings/script-data';
import { useRecentPosts, type RecentPost } from './use-recent-posts';

/** Shown wherever a post has no figure yet, matching the mockup. */
const EMPTY_VALUE = '—';

/**
 * Format a percentage, or the em dash when there isn't one.
 *
 * @param rate - Whole-number percentage, or null when the post has not been sent.
 * @return Display string.
 */
const asPercent = ( rate: number | null ): string => ( rate === null ? EMPTY_VALUE : `${ rate }%` );

/**
 * Get the row id DataViews keys on.
 *
 * @param post - The row.
 * @return Stable id.
 */
const getPostId = ( post: RecentPost ): string => String( post.id );

/**
 * The Recent Posts table.
 *
 * `DataViews` rather than a hand-rolled table, so this matches the Subscribers
 * table in the same package — same field/view shape, same look. It is read only
 * here: no actions, no search, nothing sortable, since the rows are a short
 * preview with "View all" for the rest.
 *
 * @return The recent posts card.
 */
export const RecentPosts = (): JSX.Element => {
	const { posts, isLoading } = useRecentPosts();

	const fields = useMemo< Field< RecentPost >[] >(
		() => [
			{
				id: 'media',
				label: __( 'Thumbnail', 'jetpack-newsletter' ),
				render: ( { item }: { item: RecentPost } ) => (
					<div className="jetpack-newsletter-home__post-thumb">
						{ /* A post with no featured image keeps the box, empty — the
						     column stays aligned either way. */ }
						{ item.thumbnail && <img src={ item.thumbnail } alt="" /> }
					</div>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'title',
				label: __( 'Post', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: RecentPost } ) => item.title,
				render: ( { item }: { item: RecentPost } ) => (
					<div className="jetpack-newsletter-home__post-title">
						<Text variant="heading-sm" render={ <span /> }>
							{ item.title }
						</Text>
						{ item.date && (
							<Text variant="body-sm" className="jetpack-newsletter-home__muted">
								{ item.date }
							</Text>
						) }
					</div>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: RecentPost } ) => item.status,
				render: ( { item }: { item: RecentPost } ) => (
					<Badge>
						{ item.status === 'draft'
							? __( 'Draft', 'jetpack-newsletter' )
							: __( 'Published', 'jetpack-newsletter' ) }
					</Badge>
				),
				enableSorting: false,
			},
			{
				id: 'recipients',
				label: __( 'Recipients', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: RecentPost } ) => item.recipients ?? 0,
				render: ( { item }: { item: RecentPost } ) => (
					<span>{ item.recipients === null ? EMPTY_VALUE : String( item.recipients ) }</span>
				),
				enableSorting: false,
			},
			{
				id: 'openRate',
				label: __( 'Open rate', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: RecentPost } ) => item.openRate ?? 0,
				render: ( { item }: { item: RecentPost } ) => <span>{ asPercent( item.openRate ) }</span>,
				enableSorting: false,
			},
			{
				id: 'clickRate',
				label: __( 'Click rate', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: RecentPost } ) => item.clickRate ?? 0,
				render: ( { item }: { item: RecentPost } ) => <span>{ asPercent( item.clickRate ) }</span>,
				enableSorting: false,
			},
		],
		[]
	);

	// `DataViews` is a controlled component, so the view is state even though
	// nothing here changes it.
	const [ view, setView ] = useState< View >( {
		type: 'table',
		page: 1,
		perPage: 5,
		titleField: 'title',
		mediaField: 'media',
		showTitle: true,
		showMedia: true,
		fields: [ 'status', 'recipients', 'openRate', 'clickRate' ],
		layout: {
			styles: {
				media: { width: '56px' },
				title: { minWidth: '240px' },
				recipients: { align: 'end' },
				openRate: { align: 'end' },
				clickRate: { align: 'end' },
			},
		},
	} );

	return (
		<div className="jetpack-newsletter-home__panel">
			<div className="jetpack-newsletter-home__panel-header">
				<Text variant="heading-lg" render={ <h2 /> }>
					{ __( 'Recent Posts', 'jetpack-newsletter' ) }
				</Text>
				{ /* The mode's own Posts screen. Falls back to the plain one if script
				     data is missing, so the link is never dead. */ }
				<a
					className="jetpack-newsletter-home__view-all"
					href={ getNewsletterModeScriptData()?.postsUrl ?? 'edit.php' }
				>
					{ __( 'View all', 'jetpack-newsletter' ) }
				</a>
			</div>
			<div className="jetpack-newsletter-home__posts">
				<DataViews< RecentPost >
					data={ posts }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					getItemId={ getPostId }
					isLoading={ isLoading }
					paginationInfo={ { totalItems: posts.length, totalPages: 1 } }
					defaultLayouts={ { table: {} } }
					search={ false }
				>
					{ /* Composing the children replaces the default layout wholesale,
					     which is how `DataViews` is meant to be stripped back: no search
					     bar, no view-config cog, no pagination footer. This is a fixed
					     five-row preview with "View all" for the rest — none of that
					     chrome has anything to act on. */ }
					<DataViews.Layout />
				</DataViews>
			</div>
		</div>
	);
};
