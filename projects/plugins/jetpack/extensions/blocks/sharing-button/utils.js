import { __ } from '@wordpress/i18n';
import variations from './variations';

export const getIconBySite = name => {
	const variation = variations.find( v => v.name === name );
	return variation ? variation.icon : null;
};

export const getNameBySite = name => {
	const variation = variations.find( v => v.name === name );
	return variation ? variation.title : __( 'Sharing Button', 'jetpack' );
};
