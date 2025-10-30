import { getIconColor } from '@automattic/jetpack-shared-extension-utils';
import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import transformsSource from '../shared/settings/transforms';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';
import variations from './variations';

const name = 'field-name';

// We define variations for Name, First name, and Last name.
// For this block only, override transforms to remove the generic self-transform
// to `jetpack/field-name`, so the Transform menu doesn’t show duplicate “Name”.
// Other blocks still use the shared transforms (and can transform to Name/its variations).
function notSelfNameTransform( transform ) {
	return ! (
		Array.isArray( transform.blocks ) && transform.blocks.includes( 'jetpack/field-name' )
	);
}

const transforms = {
	...transformsSource,
	to: transformsSource.to.filter( notSelfNameTransform ),
};

const settings = {
	...defaultSettings,
	title: __( 'Name field', 'jetpack-forms' ),
	description: __( 'Collect the site visitor’s name.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M8.25 11.5C9.63071 11.5 10.75 10.3807 10.75 9C10.75 7.61929 9.63071 6.5 8.25 6.5C6.86929 6.5 5.75 7.61929 5.75 9C5.75 10.3807 6.86929 11.5 8.25 11.5ZM8.25 10C8.80228 10 9.25 9.55228 9.25 9C9.25 8.44772 8.80228 8 8.25 8C7.69772 8 7.25 8.44772 7.25 9C7.25 9.55228 7.69772 10 8.25 10ZM13 15.5V17.5H11.5V15.5C11.5 14.8096 10.9404 14.25 10.25 14.25H6.25C5.55964 14.25 5 14.8096 5 15.5V17.5H3.5V15.5C3.5 13.9812 4.73122 12.75 6.25 12.75H10.25C11.7688 12.75 13 13.9812 13 15.5ZM20.5 11H14.5V9.5H20.5V11ZM20.5 14.5H14.5V13H20.5V14.5Z" />
		),
	},
	transforms,
	variations,
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Name', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'text',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
