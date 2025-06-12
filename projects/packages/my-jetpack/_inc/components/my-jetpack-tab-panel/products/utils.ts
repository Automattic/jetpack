import { __ } from '@wordpress/i18n';

/**
 * Get the choices for the products filter.
 *
 * @return The choices for the products filter.
 */
export function getProductsFilterChoices(): Array< { label: string; value: string } > {
	const choices = [
		{
			label: __( 'All categories', 'jetpack-my-jetpack' ),
			value: 'all',
		},
		{
			label: __( 'Recommended', 'jetpack-my-jetpack' ),
			value: 'recommended',
		},
		{
			label: __( 'Installed', 'jetpack-my-jetpack' ),
			value: 'installed',
		},
		{
			label: __( 'Included in plan', 'jetpack-my-jetpack' ),
			value: 'included',
		},
		{
			label: __( 'Security', 'jetpack-my-jetpack' ),
			value: 'security',
		},
		{
			label: __( 'Growth', 'jetpack-my-jetpack' ),
			value: 'growth',
		},
		{
			label: __( 'Performance', 'jetpack-my-jetpack' ),
			value: 'performance',
		},
		{
			label: __( 'Management', 'jetpack-my-jetpack' ),
			value: 'management',
		},
		{
			label: __( 'Create', 'jetpack-my-jetpack' ),
			value: 'create',
		},
	];

	return choices;
}
