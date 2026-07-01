/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import {
	calculateDelta,
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useUtmInsights from './use-utm-insights';
import widgetDefinition, { type UtmInsightsAttributes } from './widget';
/**
 * Types
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type UtmInsightsRenderAttributes = UtmInsightsAttributes & Partial< ReportParamsFieldAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const DEFAULT_UTM_PARAM: StatsUtmParam = 'utm_source,utm_medium';

const UTM_PARAM_OPTIONS: { label: string; value: StatsUtmParam }[] = [
	{
		label: __( 'Source / Medium', 'jetpack-premium-analytics' ),
		value: 'utm_source,utm_medium',
	},
	{
		label: __( 'Campaign / Source / Medium', 'jetpack-premium-analytics' ),
		value: 'utm_campaign,utm_source,utm_medium',
	},
	{ label: __( 'Source', 'jetpack-premium-analytics' ), value: 'utm_source' },
	{ label: __( 'Medium', 'jetpack-premium-analytics' ), value: 'utm_medium' },
	{ label: __( 'Campaign', 'jetpack-premium-analytics' ), value: 'utm_campaign' },
];

type UtmInsightsInnerProps = {
	utmParam: StatsUtmParam;
	max: number;
	setAttributes?: NonNullable<
		WidgetRenderProps< UtmInsightsRenderAttributes >[ 'setAttributes' ]
	>;
};

function UtmInsightsHeaderTitle() {
	return (
		<span className={ styles.headerTitle }>
			<Icon icon={ widgetDefinition.icon } size={ 20 } className={ styles.headerIcon } />
			<span>{ __( 'UTM Insights', 'jetpack-premium-analytics' ) }</span>
		</span>
	);
}

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param props               - Props.
 * @param props.utmParam      - Active UTM dimension.
 * @param props.max           - Max rows to display.
 * @param props.setAttributes - Optional widget attribute setter (persists utmParam selection).
 * @return The rendered leaderboard or state placeholder.
 */
function UtmInsightsInner( { utmParam, max, setAttributes }: UtmInsightsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const [ activeUtmParam, setActiveUtmParam ] = useState< StatsUtmParam >( utmParam );
	const [ selectedUtmLabel, setSelectedUtmLabel ] = useState< string | null >( null );

	useEffect( () => {
		setActiveUtmParam( utmParam );
		setSelectedUtmLabel( null );
	}, [ utmParam ] );

	const handleParamChange = useCallback(
		( value: string ) => {
			const nextUtmParam = value as StatsUtmParam;
			setSelectedUtmLabel( null );
			setActiveUtmParam( nextUtmParam );
			setAttributes?.( { utmParam: nextUtmParam } );
		},
		[ setAttributes ]
	);

	const clearSelectedUtm = useCallback( () => setSelectedUtmLabel( null ), [] );

	const { data, hasComparison, isLoading, isFetching, hasData, isError } = useUtmInsights( {
		reportParams,
		utmParam: activeUtmParam,
		max,
	} );
	const showLoading = isLoading || ( isFetching && hasData );
	const selectedUtm = useMemo(
		() => data.find( item => item.label === selectedUtmLabel ) ?? null,
		[ data, selectedUtmLabel ]
	);
	const isDrillDown = !! selectedUtm?.children?.length;
	const activeData = useMemo(
		() => ( isDrillDown ? selectedUtm?.children ?? [] : data ),
		[ data, isDrillDown, selectedUtm ]
	);

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...activeData.map( d => d.value ), 1 );
		const maxPreviousValue = Math.max( ...activeData.map( d => d.previousValue ), 1 );

		return activeData.map( ( item, index ) => ( {
			id: `${ index }-${ item.label }`,
			label: (
				<Stack align="center" className={ styles.itemLabel }>
					<Text className={ styles.itemLabelText }>{ item.label }</Text>
				</Stack>
			),
			currentValue: item.value,
			currentShare: ( item.value / maxValue ) * 100,
			previousValue: item.previousValue,
			previousShare:
				hasComparison && item.previousValue > 0
					? ( item.previousValue / maxPreviousValue ) * 100
					: 0,
			delta: hasComparison ? calculateDelta( item.value, item.previousValue ) : 0,
			...( ! isDrillDown &&
				'children' in item &&
				item.children?.length && {
					onClick: () => setSelectedUtmLabel( item.label ),
					ariaLabel: sprintf(
						/* translators: %s is the UTM value label. */
						__( 'View posts for %s', 'jetpack-premium-analytics' ),
						item.label
					),
				} ),
		} ) );
	}, [ activeData, hasComparison, isDrillDown ] );

	const header = (
		<Stack direction="row" justify="space-between" align="center" className={ styles.widgetHeader }>
			<Stack direction="row" align="center" gap="xs" className={ styles.breadcrumb }>
				{ isDrillDown ? (
					<>
						<Button
							variant="unstyled"
							onClick={ clearSelectedUtm }
							className={ styles.breadcrumbLink }
						>
							<UtmInsightsHeaderTitle />
						</Button>
						<Text className={ styles.breadcrumbSeparator }>/</Text>
						<Text className={ styles.breadcrumbCurrent }>{ selectedUtm?.label }</Text>
					</>
				) : (
					<Text className={ styles.breadcrumbTitle }>
						<UtmInsightsHeaderTitle />
					</Text>
				) }
			</Stack>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'UTM parameter', 'jetpack-premium-analytics' ) }
				hideLabelFromVision
				value={ activeUtmParam }
				options={ UTM_PARAM_OPTIONS }
				onChange={ handleParamChange }
				className={ styles.paramSelect }
			/>
		</Stack>
	);

	if ( isError ) {
		return (
			<>
				{ header }
				<div className={ styles.content }>
					<Stack align="center" justify="center" className={ styles.placeholder }>
						<Text>{ __( 'Could not load UTM data.', 'jetpack-premium-analytics' ) }</Text>
					</Stack>
				</div>
			</>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return (
			<>
				{ header }
				<div className={ styles.content }>
					<WidgetLoadingOverlay />
				</div>
			</>
		);
	}

	return (
		<>
			{ header }
			<div className={ styles.content }>
				<LeaderboardChart
					data={ leaderboardData }
					loading={ showLoading }
					withComparison={ hasComparison }
					withOverlayLabel
					showLegend={ false }
					emptyStateText={ __( 'No UTM data in this period.', 'jetpack-premium-analytics' ) }
					dataFormat={ DATA_FORMAT }
				/>
			</div>
		</>
	);
}

/**
 * UTM Insights widget render component.
 *
 * Shows traffic breakdown by UTM parameter as a ranked leaderboard. The active
 * dimension (source/medium, campaign, etc.) is switched via a dropdown in the
 * widget header and persisted in widget attributes.
 *
 * @param props               - Render props.
 * @param props.attributes    - Widget attributes (utmParam, max).
 * @param props.setAttributes - Attribute setter.
 * @return The rendered widget content.
 */
export default function UtmInsightsWidget( {
	attributes = {},
	setAttributes,
}: WidgetRenderProps< UtmInsightsRenderAttributes > ) {
	const utmParam = attributes.utmParam ?? DEFAULT_UTM_PARAM;
	const max = attributes.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<UtmInsightsInner utmParam={ utmParam } max={ max } setAttributes={ setAttributes } />
			</div>
		</WidgetRoot>
	);
}
