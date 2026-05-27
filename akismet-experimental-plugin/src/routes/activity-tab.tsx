/**
 * `<ActivityTab>` — DataViews-powered unified Activity log.
 *
 * Composes the Plan 3 surface:
 *   - <DataViews> with the five fields + paginated useActivity data
 *   - Row click opens <RowDrawer> (which mounts <BlackboxReportPanel>
 *     when row.visitor_id is set)
 *   - Bulk actions for the two comment-mutations (gated by
 *     AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS)
 *   - View state persists to localStorage via `views.ts`
 *
 * The `initialCategoryFilter` prop wires the Overview cards' deep-link:
 * Plan 2's "See activity →" buttons set the URL to ?tab=activity&category=X
 * and the App's tab orchestrator passes the category through here.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { akismetKeys } from '@/data/query-keys';
import { useActivity } from '@/hooks/use-activity';
import { useActions } from '@/routes/activity/actions';
import { activityFields } from '@/routes/activity/fields';
import { RowDrawer } from '@/routes/activity/row-drawer';
import { viewToParams } from '@/routes/activity/view-to-params';
import { defaultView, loadView, saveView, withCategoryFilter } from '@/routes/activity/views';
import type { ActivityCategory, ActivityRow } from '@/routes/activity/activity-types';
import type { Action, View } from '@wordpress/dataviews';
import '@/styles/activity.scss';

type Props = {
	initialCategoryFilter?: ActivityCategory | null;
};

/**
 * Top-level Activity tab.
 *
 * @param props - The component props.
 * @return The rendered tab.
 */
export function ActivityTab( props: Props ): JSX.Element {
	const { initialCategoryFilter } = props;
	const queryClient = useQueryClient();

	const [ view, setView ] = useState< View >( () => {
		const base = loadView();
		return initialCategoryFilter ? withCategoryFilter( base, initialCategoryFilter ) : base;
	} );
	const [ drawerRow, setDrawerRow ] = useState< ActivityRow | null >( null );

	// Apply incoming `initialCategoryFilter` changes (e.g., user clicks
	// a different category card in Overview after the tab has mounted).
	const lastFilter = useRef( initialCategoryFilter ?? null );
	useEffect( () => {
		if ( ( initialCategoryFilter ?? null ) === lastFilter.current ) {
			return;
		}
		lastFilter.current = initialCategoryFilter ?? null;
		setView( prev =>
			withCategoryFilter(
				prev.type === 'table' ? prev : defaultView,
				initialCategoryFilter ?? null
			)
		);
	}, [ initialCategoryFilter ] );

	const params = useMemo( () => viewToParams( view ), [ view ] );
	const { data, isLoading } = useActivity( params );

	const baseActions = useActions( () => {
		void queryClient.invalidateQueries( { queryKey: akismetKeys.activity.all() } );
	} );

	const allActions: Action< ActivityRow >[] = useMemo(
		() => [
			{
				id: 'view-details',
				label: 'View details',
				isPrimary: true,
				callback: ( items: ActivityRow[] ) => setDrawerRow( items[ 0 ] ?? null ),
			},
			...baseActions,
		],
		[ baseActions ]
	);

	if ( isLoading && ! data ) {
		return (
			<div className="akismet-activity__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="akismet-activity akismet-experimental-wide">
			<DataViews< ActivityRow >
				data={ data?.items ?? [] }
				fields={ activityFields }
				view={ view }
				onChangeView={ ( next: View ) => {
					setView( next );
					saveView( next );
				} }
				actions={ allActions }
				paginationInfo={ {
					totalItems: data?.total ?? 0,
					totalPages: data?.total_pages ?? 0,
				} }
				isLoading={ isLoading }
				defaultLayouts={ { table: {} } }
				getItemId={ ( item: ActivityRow ) => item.id }
				onClickItem={ ( item: ActivityRow ) => setDrawerRow( item ) }
				isItemClickable={ () => true }
				empty={ null }
			/>
			{ drawerRow && <RowDrawer row={ drawerRow } onClose={ () => setDrawerRow( null ) } /> }
		</div>
	);
}
