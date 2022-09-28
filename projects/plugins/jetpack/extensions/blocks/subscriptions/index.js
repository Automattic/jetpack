import { createBlock } from '@wordpress/blocks';
import { ExternalLink, Path, SVG } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import deprecated from './deprecated';
import edit from './edit';
import SubscribePanels from './panel';
import save from './save';

export const name = 'subscriptions';
export const icon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path
			d="M20.9997 6.96749L21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7L3.00026 6.96747L3 6.96092C3 5.87793 3.87793 5 4.96092 5H19.0391C20.1221 5 21 5.87793 21 6.96092L20.9997 6.96749ZM19.3044 17.3967L13.9142 12.9048L13.2804 13.433C12.5387 14.0511 11.4613 14.0511 10.7196 13.433L10.0858 12.9048L4.69555 17.3967C4.77987 17.4615 4.88543 17.5 5 17.5H19C19.1146 17.5 19.2201 17.4615 19.3044 17.3967ZM19.5 15.6071V8.25L15.0858 11.9285L19.5 15.6071ZM4.5 8.25V15.6071L8.91424 11.9285L4.5 8.25ZM4.79543 6.54363C4.85788 6.51559 4.92712 6.5 5 6.5H19C19.0729 6.5 19.1421 6.51559 19.2046 6.54363L12.3201 12.2807C12.1347 12.4352 11.8653 12.4352 11.6799 12.2807L4.79543 6.54363Z"
			fill={ getIconColor() }
			fillRule="evenodd"
			clipRule="evenodd"
		/>
	</SVG>
);
export const settings = {
	title: __( 'Subscribe', 'jetpack' ),
	description: (
		<>
			<p>
				{ __(
					'Allow readers to receive a newsletter with future posts in their inbox.',
					'jetpack'
				) }
			</p>
			<p>
				{ createInterpolateElement(
					__(
						'Subscribers can get notifications through email or <ExternalLink>the Reader app</ExternalLink>.',
						'jetpack'
					),
					{ ExternalLink: <ExternalLink href={ 'https://wordpress.com/read' } /> }
				) }
			</p>
		</>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	keywords: [
		_x( 'newsletter', 'block search term', 'jetpack' ),
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
	],
	attributes,
	edit,
	save,
	styles: [
		{
			name: 'compact',
			label: __( 'Compact', 'jetpack' ),
		},
		{
			name: 'split',
			label: __( 'Split', 'jetpack' ),
			isDefault: true,
		},
	],
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
						successMessage: instance.raw.success_message,
					} );
				},
			},
		],
	},
	example: {
		attributes: {},
	},
	supports: {
		spacing: {
			margin: true,
			padding: true,
		},
		align: [ 'wide', 'full' ],
	},
	deprecated,
};

export const pluginSettings = {
	render: SubscribePanels,
};
