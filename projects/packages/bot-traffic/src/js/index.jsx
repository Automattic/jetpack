import {
	MetricCards,
	TrafficChart,
	TrafficSummaryRow,
	ReferralRatioDonut,
	ReferralRatioOverTime,
	ReferralQuality,
	RequestsVsReferrals,
	TopBotsTable,
	BotTypes,
	RequestsByStatus,
	TopUserAgents,
	getMetricCards,
	getTrafficTimeSeries,
	getTrafficSummary,
	getReferralRatio,
	getReferralRatioTimeSeries,
	getReferralQuality,
	getRequestsVsReferrals,
	getTopBots,
	getBotTypes,
	getRequestsByStatus,
	getTopUserAgents,
} from '@automattic/bot-traffic';
import { createRoot } from '@wordpress/element';
import './style.css';

/**
 * Bot Traffic Dashboard component.
 *
 * @return {import('react').ReactElement} The dashboard.
 */
function BotTrafficDashboard() {
	const siteId = window.botTrafficConfig?.siteUrl || 'example.com';

	const metrics = getMetricCards( siteId );
	const timeSeries = getTrafficTimeSeries( siteId, 30 );
	const summary = getTrafficSummary( siteId );
	const referralRatio = getReferralRatio( siteId );
	const referralTimeSeries = getReferralRatioTimeSeries( siteId, 30 );
	const quality = getReferralQuality( siteId );
	const reqVsRef = getRequestsVsReferrals( siteId );
	const topBots = getTopBots( siteId );
	const botTypes = getBotTypes( siteId );
	const statusData = getRequestsByStatus( siteId );
	const userAgents = getTopUserAgents( siteId );

	return (
		<div className="bt-dashboard">
			<header className="bt-dashboard__header">
				<div>
					<h1 className="bt-dashboard__title">AI &amp; Bot Traffic</h1>
					<p className="bt-dashboard__desc">
						Understand how AI and non-AI bots impact your content&apos;s performance.
					</p>
				</div>
			</header>

			<MetricCards metrics={ metrics } />

			<div className="bt-dashboard__row">
				<TrafficChart timeSeries={ timeSeries } />
			</div>

			<TrafficSummaryRow summary={ summary } />

			<div className="bt-dashboard__grid bt-dashboard__grid--2col">
				<ReferralRatioDonut data={ referralRatio } />
				<ReferralRatioOverTime timeSeries={ referralTimeSeries } />
			</div>

			<div className="bt-dashboard__grid bt-dashboard__grid--2col">
				<ReferralQuality data={ quality } />
				<RequestsVsReferrals data={ reqVsRef } />
			</div>

			<div className="bt-dashboard__row">
				<TopBotsTable bots={ topBots } />
			</div>

			<div className="bt-dashboard__grid bt-dashboard__grid--2col">
				<BotTypes data={ botTypes } />
				<RequestsByStatus data={ statusData } />
			</div>

			<div className="bt-dashboard__row">
				<TopUserAgents data={ userAgents } />
			</div>
		</div>
	);
}

const container = document.getElementById( 'jetpack-bot-traffic-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <BotTrafficDashboard /> );
}
