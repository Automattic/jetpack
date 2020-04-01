/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import { Rect, Path, SVG } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { defaultAttributes } from './attributes';
import edit from './edit';
import save from './save';
import { supportsCollections } from '../../shared/block-category';

export const name = 'subscriptions';
export const settings = {
	title: __( 'Subscription Form', 'jetpack' ),
	description: (
		<p>
			{ __(
				'A form enabling readers to get notifications when new posts are published from this site.',
				'jetpack'
			) }
		</p>
	),
	icon: (
		<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<Rect
				x="4.75"
				y="6.75"
				width="14.5"
				height="10.5"
				rx="1.25"
				stroke="black"
				stroke-width="1.5"
				fill="none"
			/>
			<Path
				d="M19 7L13.3609 12.2363C12.5935 12.9489 11.4065 12.9489 10.6391 12.2363L5 7"
				stroke="black"
				stroke-width="1.5"
				stroke-linejoin="bevel"
				fill="none"
			/>
		</SVG>
	),
	category: supportsCollections() ? 'grow' : 'jetpack',
	keywords: [
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'join', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
	],
	attributes: defaultAttributes,
	edit,
	save,
	example: {
		attributes: {},
	},
	deprecated: [
		{
			attributes: {
				subscribeButton: { type: 'string', default: __( 'Subscribe', 'jetpack' ) },
				showSubscribersTotal: { type: 'boolean', default: false },
			},
			migrate: attr => {
				return {
					subscribeButton: '',
					submitButtonText: attr.subscribeButton,
					showSubscribersTotal: attr.showSubscribersTotal,
					customBackgroundButtonColor: '',
					customTextButtonColor: '',
					submitButtonClasses: '',
				};
			},

			isEligible: attr => {
				if ( ! isEmpty( attr.subscribeButton ) ) {
					return false;
				}
				return true;
			},
			save: function( { attributes } ) {
				return (
					<RawHTML>{ `[jetpack_subscription_form show_subscribers_total="${ attributes.showSubscribersTotal }" show_only_email_and_button="true"]` }</RawHTML>
				);
			},
		},
	],
};
