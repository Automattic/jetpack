/**
 * External dependencies
 */
import {
	LeaderboardChart,
	LeaderboardRow,
	LeaderboardSkeleton,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	resolveLeaderboardRowAction,
	safeHttpUrl,
	sharePercentage,
	useWidgetDrillDown,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { tag as tagIllustration } from '@jetpack-premium-analytics/icons';
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { category, tag as tagGlyph } from '@wordpress/icons';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useTagViews, { type TagChildView } from './use-tag-views';
import { type TagsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TagsRenderAttributes = Partial< ReportParamsFieldAttributes > & TagsAttributes;
type TagsWidgetProps = WidgetRenderProps< TagsRenderAttributes >;

// The Stats sanitizer marks a category with the `folder` glyph key; every other
// row is a tag.
const rowGlyph = ( labelIcon: string ) => ( labelIcon === 'folder' ? category : tagGlyph );

interface TagGroupMembersProps {
	/**
	 * The selected group's individual tags/categories.
	 */
	members: TagChildView[];
}

/**
 * Drilled-in view for a grouped row: the individual tags and categories that
 * share the selected group. The Stats endpoint reports only the group's
 * combined views, so members are listed as links without their own values.
 */
function TagGroupMembers( { members }: TagGroupMembersProps ) {
	return (
		<Stack direction="column" className={ styles.childList }>
			{ members.map( member => (
				<LeaderboardRow
					key={ member.id }
					label={ member.label }
					media={ { kind: 'icon', icon: rowGlyph( member.labelIcon ) } }
					action={ resolveLeaderboardRowAction( {
						href: safeHttpUrl( member.link ) ?? undefined,
						hasChildren: false,
					} ) }
				/>
			) ) }
		</Stack>
	);
}

function TagsInner() {
	const { data, isLoading, isFetching, isError, refetch } = useTagViews( {
		max: WIDGET_ROW_LIMIT,
	} );

	// Key the selection on the group's stable label and resolve it fresh from the
	// data, so a reorder keeps the drilled-in view and a dropped group falls back to top.
	const {
		drillDownItem: selectedLabel,
		drillDown: selectGroup,
		resetDrillDown: clearSelection,
	} = useWidgetDrillDown< string >();

	const selectedGroup = useMemo(
		() => ( selectedLabel ? data.find( row => row.label === selectedLabel ) ?? null : null ),
		[ data, selectedLabel ]
	);

	useEffect( () => {
		if ( selectedLabel && ! selectedGroup ) {
			clearSelection();
		}
	}, [ selectedLabel, selectedGroup, clearSelection ] );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...data.map( row => row.value ), 0 );

		return data.map( row => {
			const isGroup = row.children.length > 0;

			return {
				id: row.id,
				currentValue: row.value,
				currentShare: sharePercentage( row.value, maxValue ),
				// Grouped rows have no single archive URL, so a click drills into
				// their members instead. Single tag/category rows link out directly.
				...buildLeaderboardRow( {
					label: row.label,
					media: { kind: 'icon', icon: rowGlyph( row.labelIcon ) },
					action: resolveLeaderboardRowAction( {
						href: safeHttpUrl( row.link ) ?? undefined,
						hasChildren: isGroup,
						drillDown: {
							onClick: () => selectGroup( row.label ),
							ariaLabel: sprintf(
								/* translators: %s is the grouped tags and categories label */
								__( 'View the tags and categories in %s', 'jetpack-premium-analytics-pkg' ),
								row.label
							),
						},
					} ),
				} ),
			};
		} );
	}, [ data, selectGroup ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				{ selectedGroup && (
					<WidgetBackLink
						label={ __( 'All tags & categories', 'jetpack-premium-analytics-pkg' ) }
						onClick={ clearSelection }
					/>
				) }
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ {
						description: __(
							"We couldn't load tags & categories. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						icon: tagIllustration,
						description: __(
							'Learn about your most visited tags & categories to track engaging topics.',
							'jetpack-premium-analytics-pkg'
						),
					} }
					// The drilled-in view is a plain link list, not a leaderboard, so it
					// keeps the default shape.
					renderLoading={
						selectedGroup ? undefined : <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } />
					}
				>
					{ selectedGroup ? (
						<TagGroupMembers members={ selectedGroup.children } />
					) : (
						<LeaderboardChart
							data={ leaderboardData }
							withOverlayLabel
							showLegend={ false }
							// Exact counts, not the leaderboards' usual compact form: this
							// widget is read beside the same module in Jetpack Stats, where
							// 1,240 views reads "1,240". Compacted to "1K" it looks like a
							// data mismatch rather than like rounding.
							dataFormat={ {
								type: 'number',
								options: { useMultipliers: false, decimals: 0 },
							} }
						/>
					) }
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="tags" />
			</WidgetFooter>
		</Stack>
	);
}

/**
 * Ported from the Jetpack Stats "Tags & categories" module. Grouped rows
 * (several tags/categories sharing a post) drill down to their individual members.
 */
export default function Tags( { attributes = {} }: TagsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TagsInner />
		</WidgetRoot>
	);
}
