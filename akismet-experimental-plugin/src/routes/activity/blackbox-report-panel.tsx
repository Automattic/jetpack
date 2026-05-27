/**
 * `<BlackboxReportPanel>` — drawer-only panel that surfaces the per-row
 * Blackbox verdict. Only mounted when the row carries a `visitor_id`,
 * so the underlying query never fires for comment rows without a
 * captured `_blackbox_session_id`.
 */
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useBlackboxRowVerdict } from '@/hooks/use-blackbox-row-verdict';

type Props = { visitorId: string };

/**
 * Format a decimal log-odds value for the signals list.
 *
 * @param value - Log-odds value, possibly negative.
 * @return Signed string, e.g. "+2.4" / "-1.1".
 */
function formatLogOdds( value: number ): string {
	return ( value >= 0 ? '+' : '' ) + value.toFixed( 1 );
}

/**
 * Render the Blackbox verdict panel for one row.
 *
 * @param props - The component props.
 * @return The rendered panel.
 */
export function BlackboxReportPanel( props: Props ): JSX.Element {
	const { visitorId } = props;
	const { data, isLoading } = useBlackboxRowVerdict( visitorId );

	if ( isLoading || ! data ) {
		return (
			<section className="akismet-activity-drawer__blackbox">
				<Spinner />
			</section>
		);
	}

	return (
		<section className="akismet-activity-drawer__blackbox">
			<header className="akismet-activity-drawer__blackbox-header">
				<h4>{ __( 'Blackbox verdict', 'akismet' ) }</h4>
				{ data.preview && (
					<span className="akismet-activity__preview-pill">{ __( 'Preview', 'akismet' ) }</span>
				) }
			</header>
			<dl className="akismet-activity-drawer__verdict-grid">
				<div>
					<dt>{ __( 'Decision', 'akismet' ) }</dt>
					<dd>
						<code
							className={ `akismet-activity-drawer__decision akismet-activity-drawer__decision--${ data.decision }` }
						>
							{ data.decision }
						</code>
					</dd>
				</div>
				<div>
					<dt>{ __( 'Risk score', 'akismet' ) }</dt>
					<dd>{ Math.round( data.risk_score * 100 ) }%</dd>
				</div>
				<div>
					<dt>{ __( 'Confidence', 'akismet' ) }</dt>
					<dd>{ data.confidence }</dd>
				</div>
				<div>
					<dt>{ __( 'Visitor identity', 'akismet' ) }</dt>
					<dd>
						<code>{ data.visitor_id }</code>
					</dd>
				</div>
				<div>
					<dt>{ __( 'IP address', 'akismet' ) }</dt>
					<dd>
						<code>{ data.ip_address }</code>
					</dd>
				</div>
			</dl>
			<h5>{ __( 'Signals that fired', 'akismet' ) }</h5>
			<ul className="akismet-activity-drawer__signals">
				{ data.signals.map( s => (
					<li key={ s.rule_id }>
						<code className="akismet-activity-drawer__signal-name">{ s.name }</code>
						<span className="akismet-activity-drawer__signal-meta">
							{ sprintf(
								/* translators: 1: signed log-odds value, 2: confidence percent, 3: category. */
								__( '%1$s log-odds · %2$d%% confidence · %3$s', 'akismet' ),
								formatLogOdds( s.log_odds ),
								Math.round( s.confidence * 100 ),
								s.category
							) }
						</span>
					</li>
				) ) }
			</ul>
		</section>
	);
}
