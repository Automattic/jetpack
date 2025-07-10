import { __ } from '@wordpress/i18n';

export const buttonStyle = {
	name: 'button',
	label: __( 'Button (210 x 113 pixels)', 'jetpack' ),
};

export const getStyleOptions = rid =>
	[
		{ name: 'standard', label: __( 'Standard (224 x 301 pixels)', 'jetpack' ), isDefault: true },
		{ name: 'tall', label: __( 'Tall (288 x 490 pixels)', 'jetpack' ) },
		{ name: 'wide', label: __( 'Wide (840 x 150 pixels)', 'jetpack' ) },
		( ! rid || rid.length === 1 ) && buttonStyle,
	].filter( Boolean );

export const getStyleValues = rid => getStyleOptions( rid ).map( option => option.name );
