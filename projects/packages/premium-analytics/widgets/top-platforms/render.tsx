/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
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
import usePlatformViews from './use-platform-views';

type TopPlatformsRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes > & {
		max?: number;
	};
};

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const MODE_OPTIONS = [
	{ label: __( 'Browser', 'jetpack-premium-analytics' ), value: 'browser' },
	{ label: __( 'OS', 'jetpack-premium-analytics' ), value: 'platform' },
] as const;

type PlatformMode = 'browser' | 'platform';

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param root0     - Props.
 * @param root0.max - Max rows to display.
 * @return The rendered leaderboard or state placeholder.
 */
function TopPlatformsInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();
	const [ mode, setMode ] = useState< PlatformMode >( 'browser' );

	const handleModeChange = useCallback( ( value: string ) => {
		setMode( value as PlatformMode );
	}, [] );

	const { data, isLoading, isError } = usePlatformViews( {
		reportParams,
		max,
		deviceProperty: mode,
	} );

	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Could not load platform data.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	const maxViews = Math.max( ...data.map( d => d.views ), 1 );
	const leaderboardData: LeaderboardChartData = data.map( ( item, index ) => ( {
		id: `${ index }-${ item.label }`,
		label: <span className={ styles.rowLabel }>{ item.label }</span>,
		currentValue: item.views,
		currentShare: ( item.views / maxViews ) * 100,
		previousValue: 0,
		previousShare: 0,
		delta: 0,
	} ) );

	return (
		<>
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className={ styles.widgetHeader }
			>
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'Top Platforms', 'jetpack-premium-analytics' ) }
				</Text>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'View by', 'jetpack-premium-analytics' ) }
					hideLabelFromVision
					value={ mode }
					options={ MODE_OPTIONS }
					onChange={ handleModeChange }
					className={ styles.modeSelect }
				/>
			</Stack>
			<div className={ styles.content }>
				<LeaderboardChart
					data={ leaderboardData }
					loading={ isLoading }
					withOverlayLabel
					emptyStateText={ __( 'No platform data in this period.', 'jetpack-premium-analytics' ) }
					dataFormat={ DATA_FORMAT }
				/>
			</div>
		</>
	);
}

/**
 * Top Platforms widget render component.
 *
 * Shows browser or OS breakdown as a ranked leaderboard. The active
 * dimension is switched via a runtime dropdown in the header.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (max).
 * @return The rendered widget content.
 */
export default function TopPlatformsWidget( { attributes }: TopPlatformsRenderProps ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<TopPlatformsInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
