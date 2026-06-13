/**
 * External dependencies
 */
import {
	OrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
	type WidgetErrorConfig,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useState } from 'react';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/*
 * Error config reported by toolkit widgets through WidgetRoot's setError
 * channel.
 */
type WidgetError = WidgetErrorConfig | true | null;

type AverageItemsPerOrderRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

type WidgetErrorNoticeProps = {
	error: WidgetErrorConfig | true;
};

function WidgetErrorNotice( { error }: WidgetErrorNoticeProps ) {
	const config: Partial< WidgetErrorConfig > = error === true ? {} : error;
	const defaultMessage = __(
		"We couldn't load this data. Please try again in a moment.",
		'jetpack-premium-analytics'
	);
	const message = config.message ?? defaultMessage;

	return (
		<Notice.Root intent="error" spokenMessage={ message || defaultMessage }>
			{ message && <Notice.Description>{ message }</Notice.Description> }
			{ config.action && (
				<Notice.Actions>
					<Notice.ActionButton onClick={ config.action.onClick }>
						{ config.action.label }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

/**
 * Average items per order widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; OrderMetricWidget fetches
 * the orders report and renders the avg_items metric with a comparison delta
 * and sparkline.
 *
 * The host widget contract (`WidgetRenderProps`) has no error channel, so the
 * widget holds the toolkit's setError state itself and renders an inline
 * notice. OrderMetricWidget stays mounted while reporting an error so retry
 * results and report-param changes can clear the local error state.
 */
export default function AverageItemsPerOrderRender( {
	attributes,
}: AverageItemsPerOrderRenderProps ) {
	const [ error, setError ] = useState< WidgetError >( null );

	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			{ error && <WidgetErrorNotice error={ error } /> }
			<OrderMetricWidget metricKey="avg_items" />
		</WidgetRoot>
	);
}
