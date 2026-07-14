/**
 * External dependencies
 */
import {
	LeaderboardChart,
	WidgetBackLink,
	WidgetRoot,
	WidgetState,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { tag as tagIllustration } from '@jetpack-premium-analytics/icons';
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { category, tag as tagGlyph } from '@wordpress/icons';
import { Icon, Link, Stack } from '@wordpress/ui';
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

// Icon + label fields shared by the leaderboard rows and the drilled-in members;
// documented on TagChildView.
type TagLabelProps = Pick< TagChildView, 'labelIcon' | 'label' | 'link' >;

interface TagGroupMembersProps {
	/**
	 * The selected group's individual tags/categories.
	 */
	members: TagChildView[];
}

/**
 * Icon + label for a single tag/category, shared by the leaderboard rows and the
 * drilled-in group members. A member with an archive URL renders an external
 * link; one without renders plain text.
 *
 * @param {TagLabelProps} props - The component props.
 * @return The rendered label.
 */
function TagLabel( { labelIcon, label, link }: TagLabelProps ) {
	return (
		<>
			<Icon icon={ rowGlyph( labelIcon ) } size={ 20 } className={ styles.itemIcon } />
			{ link ? (
				<Link
					className={ styles.itemLabelText }
					href={ link }
					variant="unstyled"
					openInNewTab
					title={ label }
				>
					{ label }
				</Link>
			) : (
				<span className={ styles.itemLabelText } title={ label }>
					{ label }
				</span>
			) }
		</>
	);
}

/**
 * Drilled-in view for a grouped row: the individual tags and categories that
 * share the selected group. The Stats endpoint reports only the group's
 * combined views, so members are listed as links without their own values.
 *
 * @param {TagGroupMembersProps} props - The component props.
 * @return The rendered member list.
 */
function TagGroupMembers( { members }: TagGroupMembersProps ) {
	return (
		<Stack direction="column" className={ styles.childList }>
			{ members.map( member => (
				<div key={ member.id } className={ styles.childRow }>
					<TagLabel labelIcon={ member.labelIcon } label={ member.label } link={ member.link } />
				</div>
			) ) }
		</Stack>
	);
}

/**
 * Tags & categories widget inner component. Reads report params from WidgetRoot
 * context, fetches the ranked tags/categories, and drills grouped rows down to
 * their members.
 *
 * @param {TagsAttributes} attributes - The widget attributes.
 * @return The rendered widget content.
 */
function TagsInner( { max = 10 }: TagsAttributes ) {
	const { reportParams } = useWidgetRootContext();
	const { data, isLoading, isFetching, isError, refetch } = useTagViews( { reportParams, max } );

	// Key the selection on the group's stable label and resolve the row fresh from
	// the current data, so a background refetch that reorders rows keeps the user
	// in the drilled-in view, and one that drops the group falls back to the top.
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
				label: (
					<Stack align="center" className={ styles.itemLabel }>
						<TagLabel labelIcon={ row.labelIcon } label={ row.label } link={ row.link } />
					</Stack>
				),
				currentValue: row.value,
				currentShare: maxValue > 0 ? ( row.value / maxValue ) * 100 : 0,
				// Grouped rows have no single archive URL, so a click drills into
				// their members instead. Single tag/category rows link out directly.
				...( isGroup && {
					onClick: () => selectGroup( row.label ),
					ariaLabel: sprintf(
						/* translators: %s is the grouped tags and categories label */
						__( 'View the tags and categories in %s', 'jetpack-premium-analytics' ),
						row.label
					),
				} ),
			};
		} );
	}, [ data, selectGroup ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				{ selectedGroup && (
					<WidgetBackLink
						label={ __( 'All tags & categories', 'jetpack-premium-analytics' ) }
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
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: tagIllustration,
						description: __(
							'Learn about your most visited tags & categories to track engaging topics.',
							'jetpack-premium-analytics'
						),
					} }
				>
					{ selectedGroup ? (
						<TagGroupMembers members={ selectedGroup.children } />
					) : (
						<LeaderboardChart
							data={ leaderboardData }
							withOverlayLabel
							showLegend={ false }
							dataFormat={ {
								type: 'number',
								options: { useMultipliers: true, decimals: 0 },
							} }
						/>
					) }
				</WidgetState>
			</div>
		</Stack>
	);
}

/**
 * Tags & categories widget: the site's most visited tags and categories for the
 * selected period, ranked by views. Ported from the Jetpack Stats "Tags &
 * categories" module. Grouped rows (several tags/categories sharing a post) drill
 * down to their individual members.
 *
 * @param {TagsWidgetProps} props - The widget render props.
 * @return The rendered Tags & categories widget.
 */
export default function Tags( { attributes = {} }: TagsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TagsInner max={ attributes.max } />
		</WidgetRoot>
	);
}
