import { __ } from '@wordpress/i18n';

/**
 * Get the available font options.
 *
 * @return An array of font options, each with a label and value.
 */
export function getFontOptions(): Array< { label: string; value: string } > {
	return [
		{
			label: __( 'Default', 'jetpack-publicize-components' ),
			value: '',
		},
		{
			label: __( 'Inter', 'jetpack-publicize-components' ),
			value: 'inter',
		},
		{
			label: __( 'Oswald', 'jetpack-publicize-components' ),
			value: 'oswald',
		},
		{
			label: __( 'HK Grotesk', 'jetpack-publicize-components' ),
			value: 'hk-grotesk',
		},
		{
			label: __( 'Noto Sans CJK', 'jetpack-publicize-components' ),
			value: 'noto-sans-cjk',
		},
	];
}
