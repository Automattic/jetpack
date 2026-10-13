/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type Region = 'US' | 'world';

/**
 * @property region - The locations listed, US states or countries. Defaults to `US`.
 */
export type VisitorsByLocationAttributes = {
	region?: Region;
};

const DEFAULT_REGION_LABEL = __( 'United States', 'jetpack-woocommerce-stats-pkg' );
export const DEFAULT_REGION = 'US';

export const DEFAULT_REGION_COUNTRY = { code: 'US', name: DEFAULT_REGION_LABEL };

const REGION_TYPES = [
	{ value: DEFAULT_REGION, label: DEFAULT_REGION_LABEL },
	{ value: 'world', label: __( 'Worldwide', 'jetpack-woocommerce-stats-pkg' ) },
];

export default {
	attributes: [
		{
			id: 'region',
			label: __( 'Region', 'jetpack-woocommerce-stats-pkg' ),
			type: 'jpa/toggle-group',
			elements: REGION_TYPES,
			relevance: 'high',
		},
	] as WidgetAttributeField< VisitorsByLocationAttributes >[],
};
