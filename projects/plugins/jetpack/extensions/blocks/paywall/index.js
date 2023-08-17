import { SVG, Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import transforms from './transforms';

const icon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path d="M4 16.7134L20 16.7134V15.106H4V16.7134Z" fill={ getIconColor() } />
		<Path d="M16 21H20V19.3925H16V21Z" fill={ getIconColor() } />
		<Path d="M14 21H10V19.3925H14V21Z" fill={ getIconColor() } />
		<Path d="M4 21H8V19.3925H4V21Z" fill={ getIconColor() } />
		<Path
			d="M11.471 6.37162C11.2294 6.55286 11.1538 6.74395 11.1538 6.88519C11.1538 7.02644 11.2294 7.21752 11.471 7.39877C11.7108 7.57865 12.0728 7.70953 12.5 7.70953C13.1349 7.70953 13.7344 7.90158 14.1907 8.24382C14.6451 8.5847 15 9.11491 15 9.77039C15 10.4259 14.6451 10.9561 14.1907 11.297C13.8758 11.5331 13.4928 11.6978 13.0769 11.7771V12.0373C13.0769 12.3788 12.8186 12.6556 12.5 12.6556C12.1814 12.6556 11.9231 12.3788 11.9231 12.0373V11.7771C11.5072 11.6978 11.1242 11.5331 10.8093 11.297C10.3549 10.9561 10 10.4259 10 9.77039C10 9.42893 10.2583 9.15213 10.5769 9.15213C10.8955 9.15213 11.1538 9.42893 11.1538 9.77039C11.1538 9.91163 11.2294 10.1027 11.471 10.284C11.7108 10.4638 12.0728 10.5947 12.5 10.5947C12.9272 10.5947 13.2892 10.4638 13.529 10.284C13.7706 10.1027 13.8462 9.91163 13.8462 9.77039C13.8462 9.62914 13.7706 9.43806 13.529 9.25681C13.2892 9.07693 12.9272 8.94605 12.5 8.94605C11.8651 8.94605 11.2656 8.754 10.8093 8.41176C10.3549 8.07089 10 7.54067 10 6.88519C10 6.22971 10.3549 5.6995 10.8093 5.35863C11.1242 5.12246 11.5072 4.95781 11.9231 4.87844V4.61826C11.9231 4.2768 12.1814 4 12.5 4C12.8186 4 13.0769 4.2768 13.0769 4.61826V4.87844C13.4928 4.95781 13.8758 5.12246 14.1907 5.35863C14.6451 5.6995 15 6.22971 15 6.88519C15 7.22665 14.7417 7.50345 14.4231 7.50345C14.1045 7.50345 13.8462 7.22665 13.8462 6.88519C13.8462 6.74395 13.7706 6.55286 13.529 6.37162C13.2892 6.19174 12.9272 6.06085 12.5 6.06085C12.0728 6.06085 11.7108 6.19174 11.471 6.37162Z"
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
