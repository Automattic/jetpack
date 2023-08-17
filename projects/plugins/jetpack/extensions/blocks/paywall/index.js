import { SVG, Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import transforms from './transforms';

const icon = (
	<SVG width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path d="M0.334961 12.5L16.335 12.5V11H0.334961V12.5Z" fill={ getIconColor() } />
		<Path d="M12.335 16.5H16.335V15H12.335V16.5Z" fill={ getIconColor() } />
		<Path d="M10.335 16.5H6.33496V15H10.335V16.5Z" fill={ getIconColor() } />
		<Path d="M0.334961 16.5H4.33496V15H0.334961V16.5Z" fill={ getIconColor() } />
		<Path
			d="M7.80598 2.84955C7.56437 3.01868 7.48881 3.19699 7.48881 3.32879C7.48881 3.46059 7.56437 3.6389 7.80598 3.80803C8.04577 3.97588 8.40777 4.09802 8.83496 4.09802C9.46986 4.09802 10.0694 4.27723 10.5256 4.59659C10.98 4.91468 11.335 5.40944 11.335 6.0211C11.335 6.63276 10.98 7.12753 10.5256 7.44562C10.2108 7.666 9.82773 7.81964 9.41188 7.8937V8.13649C9.41188 8.45512 9.15359 8.71342 8.83496 8.71342C8.51634 8.71342 8.25804 8.45512 8.25804 8.13649V7.8937C7.8422 7.81964 7.45912 7.66599 7.1443 7.44561C6.68989 7.12753 6.33496 6.63276 6.33496 6.0211C6.33496 5.70248 6.59326 5.44418 6.91188 5.44418C7.23051 5.44418 7.48881 5.70248 7.48881 6.0211C7.48881 6.15291 7.56437 6.33122 7.80598 6.50035C8.04577 6.6682 8.40777 6.79034 8.83496 6.79034C9.26215 6.79034 9.62415 6.6682 9.86394 6.50035C10.1055 6.33122 10.1811 6.15291 10.1811 6.0211C10.1811 5.8893 10.1055 5.71099 9.86394 5.54186C9.62415 5.37401 9.26215 5.25187 8.83496 5.25187C8.20006 5.25187 7.60052 5.07266 7.1443 4.7533C6.68989 4.43522 6.33496 3.94045 6.33496 3.32879C6.33496 2.71713 6.68989 2.22236 7.1443 1.90428C7.45912 1.6839 7.8422 1.53026 8.25804 1.45619V1.2134C8.25804 0.894772 8.51634 0.636475 8.83496 0.636475C9.15359 0.636475 9.41188 0.894772 9.41188 1.2134V1.45619C9.82773 1.53026 10.2108 1.6839 10.5256 1.90428C10.98 2.22236 11.335 2.71713 11.335 3.32879C11.335 3.64742 11.0767 3.90571 10.758 3.90571C10.4394 3.90571 10.1811 3.64742 10.1811 3.32879C10.1811 3.19699 10.1055 3.01868 9.86394 2.84955C9.62415 2.68169 9.26215 2.55956 8.83496 2.55956C8.40777 2.55956 8.04577 2.68169 7.80598 2.84955Z"
			fill={ getIconColor() }
		/>
	</SVG>
);

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'paywall';
export const title = __( 'Paywall', 'jetpack' );
export const settings = {
	title,
	description: __( 'Paywall', 'jetpack' ),
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
		customClassName: false,
		html: false,
		multiple: false,
	},
	parent: [ 'core/post-content' ],
	edit,
	save: () => null,
	attributes,
	example: {
		attributes: {},
	},
	transforms,
};
