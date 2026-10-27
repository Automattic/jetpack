/**
 * External dependencies
 */
import {
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportExecutionCard } from '../../src/components/report-execution-card';
import { useExecutedReport } from '../../src/reports/hooks/use-executed-report';
import type { ReportExecution } from '../../src/reports/fetch-report';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * @property execution - The provider to force. Defaults to `auto`.
 */
export type PrototypeSessionsRemoteAttributes = {
	execution?: ReportExecution;
};

type PrototypeSessionsRemoteRenderAttributes = PrototypeSessionsRemoteAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * `sessions/by-device` with the `execution` attribute, read under the widget root for its report params.
 *
 * @param {object}          props             - The component props.
 * @param {ReportExecution} [props.execution] - The provider to force.
 * @return {JSX.Element} The card.
 */
function PrototypeSessionsRemote( { execution = 'auto' }: { execution?: ReportExecution } ) {
	const { reportParams } = useWidgetRootContext();
	const report = useExecutedReport( reportParams, {
		route: 'sessions/by-device',
		execution,
		send: [ 'from', 'to' ],
		fields: [ 'active_sessions', 'total_orders' ],
	} );

	return (
		<ReportExecutionCard
			report={ report }
			metrics={ [
				{ field: 'active_sessions', label: __( 'Sessions', 'jetpack-woocommerce-stats-pkg' ) },
				{ field: 'total_orders', label: __( 'Orders', 'jetpack-woocommerce-stats-pkg' ) },
			] }
		/>
	);
}

/**
 * The Sessions by device (remote only) prototype widget.
 *
 * @param {WidgetRenderProps< PrototypeSessionsRemoteRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function PrototypeSessionsRemoteRender( {
	attributes = {},
}: WidgetRenderProps< PrototypeSessionsRemoteRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PrototypeSessionsRemote execution={ attributes.execution } />
		</WidgetRoot>
	);
}
