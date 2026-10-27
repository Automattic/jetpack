/**
 * External dependencies
 */
import { WidgetState } from '@automattic/jetpack-premium-analytics-sdk';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './report-execution-card.module.css';
import type { useExecutedReport } from '../reports/hooks/use-executed-report';

export type ReportExecutionMetric = {
	field: string;
	label: string;
	format?: 'number' | 'currency';
};

type ExecutionError = { code?: string; message?: string; data?: { reason?: string } };

const PROVIDER_LABELS: Record< string, string > = {
	local: __( 'WooCommerce on this site (local)', 'jetpack-woocommerce-stats-pkg' ),
	remote: __( 'WordPress.com (remote)', 'jetpack-woocommerce-stats-pkg' ),
};

/**
 * A summary value for display; an absent value is a dash, never zero.
 *
 * @param {string|number|null|undefined} value  - The value.
 * @param {string}                       format - `number` or `currency`.
 * @return {string} The formatted value.
 */
function formatValue( value: string | number | null | undefined, format?: string ) {
	if ( value === null || value === undefined ) {
		return '–';
	}
	const number = Number( value );

	return format === 'currency'
		? number.toLocaleString( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 } )
		: number.toLocaleString();
}

/**
 * A report execution prototype card: the metrics, or why the provider cannot answer, and who answered.
 *
 * @param {object}                  props         - The component props.
 * @param {object}                  props.report  - The executed report result.
 * @param {ReportExecutionMetric[]} props.metrics - Summary fields to show.
 * @return {JSX.Element} The card.
 */
export function ReportExecutionCard( {
	report,
	metrics,
}: {
	report: ReturnType< typeof useExecutedReport >;
	metrics: ReportExecutionMetric[];
} ) {
	const { primary, isLoading, isError, error } = report;
	const executionError = ( error ?? {} ) as ExecutionError;
	const reason = executionError.data?.reason;

	if ( isError && executionError.code === 'needs_connection' ) {
		return (
			<div className={ styles.locked }>
				<strong>{ __( 'Connect to unlock', 'jetpack-woocommerce-stats-pkg' ) }</strong>
				<span>
					{ __(
						'This report comes from WordPress.com. Connect Jetpack to see it.',
						'jetpack-woocommerce-stats-pkg'
					) }
				</span>
				<code className={ styles.reason }>{ reason }</code>
			</div>
		);
	}

	const provenance = primary.data?.provenance;
	const unsupported = provenance?.unsupported_fields ?? [];
	const deviations = Object.entries( provenance?.deviations ?? {} ).map(
		( [ rule, value ] ) => `${ rule }=${ value }`
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isError={ isError }
				error={ {
					title: reason
						? __( 'Unsupported or unavailable', 'jetpack-woocommerce-stats-pkg' )
						: undefined,
					description: reason
						? sprintf(
								/* translators: 1: error message, 2: error code, 3: machine-readable reason. */
								__( '%1$s (%2$s: %3$s)', 'jetpack-woocommerce-stats-pkg' ),
								executionError.message,
								executionError.code,
								reason
							)
						: __( "We couldn't load this report.", 'jetpack-woocommerce-stats-pkg' ),
				} }
			>
				<dl className={ styles.metrics }>
					{ metrics.map( metric => (
						<div key={ metric.field } className={ styles.metric }>
							<dt>{ metric.label }</dt>
							<dd>
								{ unsupported.includes( metric.field ) ? (
									<em className={ styles.unsupported }>
										{ __( 'Unsupported', 'jetpack-woocommerce-stats-pkg' ) }
									</em>
								) : (
									formatValue( primary.data?.summary?.[ metric.field ], metric.format )
								) }
							</dd>
						</div>
					) ) }
				</dl>
				{ provenance && (
					<p className={ styles.provenance }>
						{ sprintf(
							/* translators: 1: provider name, 2: time the data was generated. */
							__( 'Served by %1$s · generated %2$s', 'jetpack-woocommerce-stats-pkg' ),
							PROVIDER_LABELS[ provenance.provider ] ?? provenance.provider,
							new Date( provenance.generated_at ).toLocaleTimeString()
						) }
						<br />
						{ sprintf(
							/* translators: %s: report contract, e.g. orders.by_date@1. */
							__( 'Contract: %s', 'jetpack-woocommerce-stats-pkg' ),
							provenance.contract
						) }
						{ deviations.length > 0 && (
							<>
								<br />
								{ sprintf(
									/* translators: %s: comma-separated rule=value pairs, e.g. week_start=sunday. */
									__( 'Differs from the contract: %s', 'jetpack-woocommerce-stats-pkg' ),
									deviations.join( ', ' )
								) }
							</>
						) }
						{ unsupported.length > 0 && (
							<>
								<br />
								{ sprintf(
									/* translators: %s: comma-separated field names. */
									__( 'Unsupported fields: %s', 'jetpack-woocommerce-stats-pkg' ),
									unsupported.join( ', ' )
								) }
							</>
						) }
					</p>
				) }
			</WidgetState>
		</div>
	);
}
