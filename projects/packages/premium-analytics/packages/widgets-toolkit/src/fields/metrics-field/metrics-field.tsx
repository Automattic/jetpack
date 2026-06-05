/**
 * External dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Fieldset, Stack } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { DEFAULT_METRICS, type Metric } from './metrics';
import type { DataFormControlProps } from '@wordpress/dataviews';

type MetricsAttributes = {
	metrics: Metric[];
};

export function MetricsField( {
	data: attributes,
	onChange,
}: DataFormControlProps< MetricsAttributes > ) {
	// Store the metrics in the attributes.
	useEffect( () => {
		if ( attributes?.metrics?.length ) {
			return;
		}

		onChange( { metrics: DEFAULT_METRICS } );
	}, [ onChange, attributes ] );

	const updateMetrics = useCallback(
		( id: string ) =>
			onChange( {
				metrics: attributes.metrics.map( m => {
					return m.id === id ? { ...m, enabled: ! m.enabled } : m;
				} ),
			} ),
		[ onChange, attributes ]
	);

	const help = sprintf(
		/* translators: %d: number of metrics */
		_n(
			'Choose up to %d metric',
			'Choose up to %d metrics',
			attributes.metrics?.length ?? 1,
			'jetpack-premium-analytics'
		),
		attributes.metrics?.length ?? 1
	);

	return (
		<Fieldset.Root>
			<Fieldset.Legend>{ __( 'Metrics', 'jetpack-premium-analytics' ) }</Fieldset.Legend>
			<Fieldset.Description>{ help }</Fieldset.Description>
			<Stack direction="column" gap="sm">
				{ attributes?.metrics?.map( metric => (
					<CheckboxControl
						key={ metric.id }
						label={ metric.label }
						checked={ metric.enabled }
						onChange={ () => updateMetrics( metric.id ) }
					/>
				) ) }
			</Stack>
		</Fieldset.Root>
	);
}
