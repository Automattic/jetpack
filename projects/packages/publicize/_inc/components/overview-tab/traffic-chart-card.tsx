import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData, siteHasFeature } from '@automattic/jetpack-script-data';
import { Spinner, SelectControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import { Button, Card, EmptyState, Notice, Stack, Text, Tooltip } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils';
import { getRefreshPlanQuery } from '../../utils/script-data';
import { SOCIAL_SERVICE_META, matchSocialService } from '../../utils/social-services';
import './traffic-chart-card.scss';
import { buildMockReferrers } from './traffic-mock';
import type { Connection, TrafficInterval, TrafficReferrerDay } from '../../social-store/types';

const CHART_HEIGHT = 240;

type Series = {
	label: string;
	data: { date: Date; value: number }[];
	options?: { stroke?: string };
};

/**
 * Reduce a `days` map from the referrers endpoint into one chart series
 * per matched social-service host. Every social referrer renders even
 * if the user hasn't connected that service via Publicize — surfacing a
 * Facebook line on a site that only auto-shares to LinkedIn is a useful
 * discovery cue ("you're already getting traffic here; connect to
 * lean in"), not noise. The Publicize connections list is consulted
 * only to pick a nicer legend label when it's available.
 *
 * Days are sorted ascending so the line draws left to right regardless
 * of the API ordering. Services with zero total over the window are
 * dropped so the legend stays focused on what's actually driving
 * visits.
 *
 * @param days        - Per-day referrer payload keyed by `YYYY-MM-DD`.
 * @param connections - Site's Publicize connections, used to pull a
 *                    human-friendly label for the legend.
 * @return One series per surviving service.
 */
function buildSeries(
	days: Record< string, TrafficReferrerDay > | undefined,
	connections: Connection[]
): Series[] {
	if ( ! days ) {
		return [];
	}

	const dates = Object.keys( days ).sort();
	if ( dates.length === 0 ) {
		return [];
	}

	const buckets = new Map< string, Map< string, number > >();
	for ( const date of dates ) {
		const groups = days[ date ]?.groups ?? [];
		for ( const group of groups ) {
			const target = group.url ?? group.name ?? '';
			const service = matchSocialService( target );
			if ( ! service ) {
				continue;
			}
			const total = Number( group.total ?? 0 );
			if ( ! Number.isFinite( total ) ) {
				continue;
			}
			const byDate = buckets.get( service ) ?? new Map< string, number >();
			byDate.set( date, ( byDate.get( date ) ?? 0 ) + total );
			buckets.set( service, byDate );
		}
	}

	const series: Series[] = [];
	for ( const [ service, byDate ] of buckets ) {
		const total = Array.from( byDate.values() ).reduce( ( a, b ) => a + b, 0 );
		if ( total === 0 ) {
			continue;
		}
		const data = dates.map( date => ( {
			date: new Date( `${ date }T00:00:00Z` ),
			value: byDate.get( date ) ?? 0,
		} ) );
		const conn = connections.find( c => c.service_name === service );
		const label =
			conn?.service_label ??
			SOCIAL_SERVICE_META[ service ]?.label ??
			service.replace( /^./, c => c.toUpperCase() );
		series.push( {
			label,
			data,
			options: { stroke: SOCIAL_SERVICE_META[ service ]?.stroke },
		} );
	}

	return series;
}

const INTERVAL_OPTIONS: Array< { label: string; value: string } > = [
	{ label: __( 'Last 7 days', 'jetpack-publicize-pkg' ), value: '7' },
	{ label: __( 'Last 30 days', 'jetpack-publicize-pkg' ), value: '30' },
	{ label: __( 'Last 90 days', 'jetpack-publicize-pkg' ), value: '90' },
];

/**
 * "Traffic from social media" card on the Overview tab. Three states
 * drive the body: a free-plan locked dummy curve overlaid with a WPDS
 * `Notice` upgrade prompt (no `social-enhanced-publishing` feature);
 * a paid-plan real chart fed by the cached `getTrafficReferrers`
 * resolver, one line per connected service that drove ≥1 visit in the
 * window; and a paid-plan-no-data empty state when nothing comes back.
 * The range Select (7/30/90 days) is always interactive — lets free
 * users feel the control, lets paid users widen the window if 7 was
 * just too narrow.
 *
 * @return The chart card element.
 */
export default function TrafficChartCard(): JSX.Element {
	const needsUpgrade = ! siteHasFeature( features.ENHANCED_PUBLISHING );
	const { setTrafficInterval } = useDispatch( socialStore );

	// Only read real referrer data when we'd actually show it. Reading
	// the resolver-backed selector triggers the fetch, so skipping it
	// on the free path keeps us off the stats-app endpoint entirely.
	const { interval, days, isLoading, connections } = useSelect(
		select => {
			const store = select( socialStore );
			const current = store.getTrafficInterval();
			return {
				interval: current,
				days: needsUpgrade ? undefined : store.getTrafficReferrers( current ),
				isLoading: needsUpgrade ? false : store.isTrafficReferrersLoading( current ),
				connections: ( store.getConnections() ?? [] ) as Connection[],
			};
		},
		[ needsUpgrade ]
	);

	const mockDays = useMemo(
		() => ( needsUpgrade ? buildMockReferrers( interval ) : undefined ),
		[ needsUpgrade, interval ]
	);

	const series = useMemo(
		() => buildSeries( needsUpgrade ? mockDays : days, connections ),
		[ needsUpgrade, mockDays, days, connections ]
	);

	const hasData = series.length > 0 && series[ 0 ].data.length > 0;

	const subtitle = sprintf(
		/* translators: %d: number of days the chart covers. */
		__( 'Visits from social media networks over the last %d days.', 'jetpack-publicize-pkg' ),
		interval
	);

	const onUpgrade = useCallback( () => {
		const data = getScriptData();
		const blogID = data?.site?.wpcom?.blog_id;
		const siteSuffix = data?.site?.suffix;
		window.location.href = getRedirectUrl( 'jetpack-social-v1-plan-plugin-admin-page', {
			site: blogID ? String( blogID ) : siteSuffix,
			query: getRefreshPlanQuery(),
		} );
	}, [] );

	const onIntervalChange = useCallback(
		( next: string ) => setTrafficInterval( Number( next ) as TrafficInterval ),
		[ setTrafficInterval ]
	);

	const showSpinner = ! needsUpgrade && isLoading && ! hasData;
	const showEmpty = ! needsUpgrade && ! isLoading && ! hasData;

	return (
		<Card.Root>
			<Card.Header className="jetpack-social-overview__chart-header">
				<Stack direction="column" gap="xs">
					<Card.Title>{ __( 'Traffic from social media', 'jetpack-publicize-pkg' ) }</Card.Title>
					<Text variant="body-sm">{ subtitle }</Text>
				</Stack>
				<div className="jetpack-social-overview__chart-range">
					{ needsUpgrade ? (
						<Tooltip.Root>
							{ /*
							 * `disabled` on the native <select> swallows pointer
							 * events, which would also swallow the tooltip
							 * trigger. Wrap in a span so hover/focus still
							 * reach the Tooltip.Root anchor.
							 */ }
							<Tooltip.Trigger render={ <span tabIndex={ 0 } /> }>
								<SelectControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize={ false }
									label={ __( 'Date range', 'jetpack-publicize-pkg' ) }
									hideLabelFromVision
									value={ String( interval ) }
									options={ INTERVAL_OPTIONS }
									disabled
								/>
							</Tooltip.Trigger>
							<Tooltip.Popup>
								{ __( 'Available with a paid plan', 'jetpack-publicize-pkg' ) }
							</Tooltip.Popup>
						</Tooltip.Root>
					) : (
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize={ false }
							label={ __( 'Date range', 'jetpack-publicize-pkg' ) }
							hideLabelFromVision
							value={ String( interval ) }
							options={ INTERVAL_OPTIONS }
							onChange={ onIntervalChange }
						/>
					) }
				</div>
			</Card.Header>
			<Card.Content className="jetpack-social-overview__chart-content">
				{ showSpinner && (
					<div className="jetpack-social-overview__chart-loading">
						<Spinner />
					</div>
				) }
				{ showEmpty && (
					<div className="jetpack-social-overview__chart-empty">
						<EmptyState.Root>
							<EmptyState.Icon icon={ trendingUp } />
							<EmptyState.Title>
								{ __( 'No traffic from social media yet', 'jetpack-publicize-pkg' ) }
							</EmptyState.Title>
							<EmptyState.Description>
								{ __(
									'Once your shared posts start driving visits, you’ll see the breakdown here.',
									'jetpack-publicize-pkg'
								) }
							</EmptyState.Description>
						</EmptyState.Root>
					</div>
				) }
				{ hasData && (
					<div className="jetpack-social-overview__chart-wrapper">
						<div
							className={
								needsUpgrade
									? 'jetpack-social-overview__chart-canvas jetpack-social-overview__chart-canvas--locked'
									: 'jetpack-social-overview__chart-canvas'
							}
							aria-hidden={ needsUpgrade ? 'true' : undefined }
						>
							<LineChart
								data={ series }
								height={ CHART_HEIGHT }
								showLegend
								withGradientFill={ false }
							/>
						</div>
						{ needsUpgrade && (
							<div className="jetpack-social-overview__chart-overlay">
								<Notice.Root intent="info" className="jetpack-social-overview__upgrade-notice">
									<Notice.Title>
										{ __( 'Unlock traffic insights', 'jetpack-publicize-pkg' ) }
									</Notice.Title>
									<Notice.Description>
										{ __(
											'Upgrade to see which social networks are driving visits to your site, day by day.',
											'jetpack-publicize-pkg'
										) }
									</Notice.Description>
									<Notice.Actions>
										<Button variant="solid" size="compact" onClick={ onUpgrade }>
											{ __( 'Upgrade now', 'jetpack-publicize-pkg' ) }
										</Button>
									</Notice.Actions>
								</Notice.Root>
							</div>
						) }
					</div>
				) }
			</Card.Content>
		</Card.Root>
	);
}
