import {
	getSiteTimezone,
	GlobalErrorProvider,
	localTZDate,
	type ReportQueryParams,
} from '@jetpack-premium-analytics/data';
import {
	deriveComparisonRange,
	encodeDateToSearchParam,
	useStagedSearch,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { endOfDay, isValid } from 'date-fns';
import { DashboardSections } from './components';
import {
	DASHBOARD_NAME,
	useActiveSection,
	useDashboardGridSettings,
	useDashboardSectionLayout,
	useDashboardSections,
} from './hooks';
import styles from './stage.module.scss';
import type {
	ComparisonPresetId,
	DateRange,
	PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';

type ReportQuerySearchParams = Partial<
	ReportQueryParams & {
		preset?: PrimaryPresetId;
		compare_preset?: ComparisonPresetId;
		comp?: '1';
	}
>;

/**
 * Premium Analytics dashboard page stage component.
 *
 * @return {JSX.Element} The Premium Analytics dashboard.
 */
function Dashboard(): JSX.Element {
	const sections = useDashboardSections();
	const [ activeSection, setActiveSection ] = useActiveSection();
	const [ layout, setLayout, resetLayout ] = useDashboardSectionLayout(
		DASHBOARD_NAME,
		activeSection
	);
	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();

	const widgetModules = useSelect(
		select =>
			(
				select( coreStore ) as unknown as {
					getEntityRecords: ( kind: string, name: string ) => WidgetModuleRecord[] | null;
				}
			 ).getEntityRecords( 'root', 'widgetModule' ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypes( widgetModules );

	const [ editMode, setEditMode ] = useState( false );

	/*
	 * Date-range state lives in the URL search params. Edits are staged
	 * locally and committed atomically on Apply (or immediately for
	 * comparison changes), so widgets re-fetch only on commit.
	 */
	const { effective, stage, commit, revert, isDirty } = useStagedSearch<
		ReportQuerySearchParams,
		'/'
	>( {
		from: '/',
	} );

	const presetId = useMemo( () => effective.preset ?? undefined, [ effective.preset ] );

	const range = useMemo( () => {
		/*
		 * Parse a search-param date into a TZDate, returning `undefined` for an
		 * unparseable value. The picker reads these straight from the URL, so a
		 * malformed `from`/`to` (e.g. a hand-edited or under-encoded deep link
		 * where the `+` offset decoded to a space) must not produce an invalid
		 * Date — `formatDate` throws "Invalid time value" on one and would
		 * white-screen the whole dashboard. `undefined` degrades gracefully.
		 */
		const parse = ( value?: string ) => {
			if ( ! value ) {
				return undefined;
			}
			const date = localTZDate( value );
			return isValid( date ) ? date : undefined;
		};

		return {
			from: parse( effective.from ),
			to: parse( effective.to ),
		};
	}, [ effective.from, effective.to ] );

	const onChange = useCallback(
		( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
			if ( ! nextRange && ! nextPresetId ) {
				return;
			}

			if ( nextRange && nextRange.from && nextRange.to ) {
				/*
				 * Stage `from` and `to` as ISO strings. The `to` date is
				 * adjusted to the end of the day, since the date picker core
				 * component sets the time to 00:00:00.
				 */
				const from = encodeDateToSearchParam( nextRange.from );
				const to = encodeDateToSearchParam( endOfDay( nextRange.to ) );
				const patch: ReportQuerySearchParams = { from, to };

				/*
				 * When comparison is enabled, re-derive the comparison window
				 * from the new primary range so widgets compare against the
				 * matching previous period instead of the stale dates.
				 */
				if ( effective.comp === '1' ) {
					const derived = deriveComparisonRange( { ...effective, from, to } );
					if ( derived ) {
						patch.compare_from = derived.compare_from;
						patch.compare_to = derived.compare_to;
					}
				}

				stage( patch );
			}

			if ( nextPresetId ) {
				stage( { preset: nextPresetId } );
			}
		},
		[ stage, effective ]
	);

	const comparisonPresetId = useMemo(
		() => effective.compare_preset ?? undefined,
		[ effective.compare_preset ]
	);

	/**
	 * Comparison changes commit immediately (no Apply step).
	 */
	const onComparisonChange = useCallback(
		( nextComparisonRange: DateRange | undefined, nextComparisonPresetId?: ComparisonPresetId ) => {
			stage( {
				compare_from: encodeDateToSearchParam( nextComparisonRange?.from ),
				compare_to: encodeDateToSearchParam( nextComparisonRange?.to ),
				compare_preset: nextComparisonPresetId ?? undefined,
				comp: nextComparisonRange ? '1' : undefined,
			} );

			commit();
		},
		[ stage, commit ]
	);

	const onApply = useCallback( () => {
		commit();
	}, [ commit ] );

	const onCancel = useCallback( () => {
		revert();
	}, [ revert ] );

	// Container element for the date filters panel responsive layout.
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<GlobalErrorProvider>
			<WidgetDashboard
				widgetTypes={ widgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				layout={ layout }
				onLayoutChange={ setLayout }
				onLayoutReset={ resetLayout }
				gridSettings={ gridSettings }
				onGridSettingsChange={ setGridSettings }
				editMode={ editMode }
				onEditChange={ setEditMode }
			>
				<Page
					title={ __( 'Analytics', 'jetpack-premium-analytics' ) }
					subTitle={ __(
						'Track your site performance and visitor insights.',
						'jetpack-premium-analytics'
					) }
					actions={ <WidgetDashboard.Actions /> }
					className={ styles.dashboard }
				>
					<DashboardSections
						sections={ sections }
						value={ activeSection }
						onChange={ setActiveSection }
					>
						{ /*
						 * The date filters drive every section, so they render once
						 * below the section tabs and above the widgets, sharing the
						 * URL search state across all sections.
						 *
						 * The wrapper div is also the responsive-measurement target:
						 * DateFiltersPanel reads its width to pick mobile/wide layouts
						 * instead of relying on the viewport.
						 */ }
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel
								presetId={ presetId }
								range={ range }
								comparisonPresetId={ comparisonPresetId }
								onChange={ onChange }
								onComparisonChange={ onComparisonChange }
								onApply={ onApply }
								onCancel={ onCancel }
								canApply={ isDirty }
								timeZone={ getSiteTimezone() }
								containerElement={ containerElement }
							/>
						</div>
						{ sections.map( section => (
							<Tabs.Panel key={ section.id } value={ section.id } className={ styles.content }>
								{ activeSection === section.id ? (
									<>
										<WidgetDashboard.NoWidgetsState />
										<WidgetDashboard.Widgets />
									</>
								) : null }
							</Tabs.Panel>
						) ) }
					</DashboardSections>

					<WidgetDashboard.Commands />
				</Page>
			</WidgetDashboard>
		</GlobalErrorProvider>
	);
}

export const stage = Dashboard;
