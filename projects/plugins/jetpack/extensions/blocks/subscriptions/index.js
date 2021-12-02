/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Rect, Path, SVG } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';
import { getIconColor } from '../../shared/block-icons';

export const name = 'subscriptions';
export const icon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Rect
			x="4.75"
			y="6.75"
			width="14.5"
			height="10.5"
			rx="1.25"
			stroke={ getIconColor() }
			strokeWidth="1.5"
			fill="none"
		/>
		<Path
			d="M19 7L13.3609 12.2363C12.5935 12.9489 11.4065 12.9489 10.6391 12.2363L5 7"
			stroke={ getIconColor() }
			strokeWidth="1.5"
			strokeLinejoin="bevel"
			fill="none"
		/>
	</SVG>
);
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
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	keywords: [
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'join', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
	],
	attributes,
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: false,
				blocks: [ 'core/legacy-widget' ],
				isMatch: ( { idBase, instance } ) => {
					if ( ! instance?.raw ) {
						return false;
					}
					return idBase === 'blog_subscription';
				},
				transform: ( { instance } ) => {
					return createBlock( 'jetpack/subscriptions', {
						showSubscribersTotal: instance.raw.show_subscribers_total,
						submitButtonText: instance.raw.subscribe_button,
						subscribePlaceholder: instance.raw.subscribe_placeholder,
					} );
				},
			},
		],
	},
	example: {
		attributes: {},
	},
	deprecated,
};
