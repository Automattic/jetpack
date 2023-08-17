import { Path, Rect, SVG, G } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import edit from './edit';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M20 4H4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h7v2H6v-2zm9 0h3v2h-3v-2z" />
		</G>
	</SVG>
);

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'paid-plans';
export const title = __( 'Paid plans', 'jetpack' );
export const settings = {
	title,
	description: __( 'Show paid plans.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
		_x( 'gated', 'block search term', 'jetpack' ),
		_x( 'memberships', 'block search term', 'jetpack' ),
		_x( 'newsletter', 'block search term', 'jetpack' ),
		_x( 'signin', 'block search term', 'jetpack' ),
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'subscription', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
	],
	supports: {
		customClassName: true,
		html: false,
		multiple: false,
		align: true,
	},
	edit,
	save: () => null,
	example: {
		attributes: {},
	},
};
