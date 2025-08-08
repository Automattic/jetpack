import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import { getIconColor } from '../shared/util/block-icons';

const variations = [
	{
		name: 'field-consent-implicit',
		title: __( 'Terms concent', 'jetpack-forms' ),
		description: __( 'Concent without checkbox.', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path d="M7 5.5H17C17.2761 5.5 17.5 5.72386 17.5 6V13H19V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H11.5V18.5H7C6.72386 18.5 6.5 18.2761 6.5 18V6C6.5 5.72386 6.72386 5.5 7 5.5ZM16 7.75H8V9.25H16V7.75ZM8 11H13V12.5H8V11Z" />
					<Path d="M20.1087 15.9382L15.9826 21.6689L12.959 18.5194L14.0411 17.4806L15.8175 19.331L18.8914 15.0618L20.1087 15.9382Z" />
				</>
			),
		},
		attributes: {
			consentType: 'implicit',
		},
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'field-consent-explicit',
		title: __( 'Concent with checkbox', 'jetpack-forms' ),
		description: __( 'Concent with checkbox.', 'jetpack-forms' ),
		icon: {
			foreground: getIconColor(),
			src: renderMaterialIcon(
				<>
					<Path d="M7 5.5H17C17.2761 5.5 17.5 5.72386 17.5 6V13H19V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H11.5V18.5H7C6.72386 18.5 6.5 18.2761 6.5 18V6C6.5 5.72386 6.72386 5.5 7 5.5ZM16 7.75H8V9.25H16V7.75ZM8 11H13V12.5H8V11Z" />
					<Path d="M20.1087 15.9382L15.9826 21.6689L12.959 18.5194L14.0411 17.4806L15.8175 19.331L18.8914 15.0618L20.1087 15.9382Z" />
				</>
			),
		},
		attributes: {
			consentType: 'explicit',
		},
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
