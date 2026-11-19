import { PeriodSelector } from '@automattic/jetpack-components';
import {
	DashboardWidgetHostProvider,
	ReportScopeProvider,
	useDashboardSectionRecords,
	useDetailPageCustomize,
	useStoredDetailLayout,
	useWidgetModuleResolver,
	useWidgetModules,
	useWidgetTypesWithI18n,
} from '@automattic/jetpack-premium-analytics-sdk';
import { Spinner } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Stack } from '@wordpress/ui';
import { WidgetDashboard, type DashboardWidget } from '@wordpress/widget-dashboard';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import FreeTierNotice from '../../src/dashboard/components/free-tier-notice';
import StorageMeterCard from '../../src/dashboard/components/overview/storage-meter-card';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { DATE_RANGE_DAYS, type DateRange } from '../../src/dashboard/types/stats';
import { lastDaysReportDates } from '../../src/dashboard/utils/stats-period';
import { STATS_DASHBOARD_NAME, STATS_GRID, STATS_PREFERENCES_SCOPE } from './config';
import './style.scss';
import type { PeriodPreset } from '@automattic/jetpack-components';
import type { ReactNode } from 'react';

const DEFAULT_DATE_RANGE: DateRange = 'last_30_days';
const NO_WIDGETS: DashboardWidget[] = [];

const getDateRangePresets = (): PeriodPreset< DateRange >[] => [
	{ value: 'last_7_days', label: __( 'Last 7 days', 'jetpack-videopress-pkg' ) },
	{ value: 'last_30_days', label: __( 'Last 30 days', 'jetpack-videopress-pkg' ) },
	{ value: 'last_90_days', label: __( 'Last 90 days', 'jetpack-videopress-pkg' ) },
	{ value: 'last_365_days', label: __( 'Last 365 days', 'jetpack-videopress-pkg' ) },
];

const StageInner = () => {
	const [ dateRange, setDateRange ] = useState< DateRange >( DEFAULT_DATE_RANGE );
	const { isFree, isAtomic, isUnlimited, videoCount, videoCountKnown } = useFreeTier();
	const dateRangePresets = useMemo( getDateRangePresets, [] );

	const { sections, hasResolved } = useDashboardSectionRecords( STATS_DASHBOARD_NAME );
	const section = sections?.[ 0 ];

	// The period reaches each widget as `reportParams` on the fixed layout: a stored arrangement
	// keeps only what differs from it, so the dates are never persisted.
	const fixedLayout = useMemo< DashboardWidget[] >( () => {
		const reportParams = lastDaysReportDates( DATE_RANGE_DAYS[ dateRange ] );

		return ( section?.default_layout ?? NO_WIDGETS ).map( ( widget: DashboardWidget ) => ( {
			...widget,
			attributes: {
				...( widget.attributes as Record< string, unknown > | undefined ),
				reportParams,
			},
		} ) );
	}, [ section, dateRange ] );

	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		STATS_PREFERENCES_SCOPE,
		section?.slug ?? '',
		fixedLayout
	);
	const {
		isCustomizing,
		canCustomize,
		canPerform,
		startCustomizing,
		resetToDefault,
		onEditChange,
		onLayoutChange,
	} = useDetailPageCustomize( layout, {
		layoutId: section?.slug,
		onLayoutReset: resetLayout,
		onLayoutChange: setLayout,
	} );

	const records = useWidgetModules();
	const visibleNames = useMemo(
		() => ( hasResolved ? layout.map( ( widget: DashboardWidget ) => widget.type ) : null ),
		[ hasResolved, layout ]
	);
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( records, {
		visibleNames,
	} );
	const resolveWidgetModule = useWidgetModuleResolver( records );

	const showStorageMeter = isFree === false && videoCount > 0 && ! isUnlimited && ! isAtomic;

	let widgets: ReactNode;
	if ( ! hasResolved ) {
		widgets = (
			<div className="vp-overview__dashboard-loading">
				<Spinner />
			</div>
		);
	} else if ( ! section ) {
		widgets = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'We couldn’t load your video stats.', 'jetpack-videopress-pkg' ) }
				</Notice.Description>
			</Notice.Root>
		);
	} else {
		widgets = <WidgetDashboard.Widgets />;
	}

	return (
		<ReportScopeProvider offersComparison={ false }>
			<DashboardWidgetHostProvider>
				<WidgetDashboard.Policy canPerform={ canPerform }>
					<WidgetDashboard
						widgetTypes={ widgetTypes }
						isResolvingWidgetTypes={ isResolvingWidgetTypes }
						resolveWidgetModule={ resolveWidgetModule }
						layout={ layout }
						onLayoutChange={ onLayoutChange }
						onLayoutReset={ resetLayout }
						gridSettings={ STATS_GRID }
						editMode={ isCustomizing }
						onEditChange={ onEditChange }
					>
						<DashboardLayout
							activeTab="stats"
							actions={
								<Stack direction="row" gap="sm" align="center">
									{ isCustomizing ? (
										<>
											<Button variant="outline" onClick={ resetToDefault }>
												{ __( 'Reset to default', 'jetpack-videopress-pkg' ) }
											</Button>
											<WidgetDashboard.Actions />
										</>
									) : (
										<>
											<PeriodSelector< DateRange >
												label={ __( 'Date range', 'jetpack-videopress-pkg' ) }
												presets={ dateRangePresets }
												value={ dateRange }
												onChange={ setDateRange }
											/>
											{ canCustomize && (
												<Button variant="outline" onClick={ startCustomizing }>
													{ __( 'Customize', 'jetpack-videopress-pkg' ) }
												</Button>
											) }
										</>
									) }
								</Stack>
							}
						>
							<div className="vp-overview">
								{ isFree && (
									<FreeTierNotice
										location="overview"
										videoCount={ videoCountKnown ? videoCount : undefined }
									/>
								) }
								{ widgets }
								{ /* Storage isn't stats-derived (it sources its own data via
								     useSite), so a stats failure doesn't take it down. */ }
								{ showStorageMeter && <StorageMeterCard /> }
							</div>
						</DashboardLayout>
					</WidgetDashboard>
				</WidgetDashboard.Policy>
			</DashboardWidgetHostProvider>
		</ReportScopeProvider>
	);
};

const Stage = () => (
	<QueryClientWrapper route="overview">
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
