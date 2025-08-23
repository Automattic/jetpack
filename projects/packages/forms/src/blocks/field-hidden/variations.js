import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen, link } from '@wordpress/icons';
import { getIconColor } from '../shared/util/block-icons';

const variations = [
	{
		name: 'static',
		title: __( 'Hidden field', 'jetpack-forms' ),
		description: __(
			'Invisible to users, this field lets you store extra data with each form submission.',
			'jetpack-forms'
		),
		icon: {
			foreground: getIconColor(),
			src: <Icon icon={ unseen } />,
		},
		attributes: { variation: 'static' },
		isActive: [ 'variation' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'query',
		title: __( 'Query parameter hidden field', 'jetpack-forms' ),
		description: __(
			'Invisible to users, this field lets you store extra data via the URL query string.',
			'jetpack-forms'
		),
		icon: {
			foreground: getIconColor(),
			src: <Icon icon={ link } />,
		},
		attributes: { variation: 'urlQuery' },
		isActive: [ 'variation' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: false,
	},
];

export default variations;
