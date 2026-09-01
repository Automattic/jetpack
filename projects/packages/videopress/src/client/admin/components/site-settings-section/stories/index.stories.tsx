/**
 * External dependencies
 */
import { action } from 'storybook/actions';
/**
 * Internal dependencies
 */
import SettingsSection from '..';

export default {
	title: 'Packages/VideoPress/Site Settings',
	component: SettingsSection,
	argTypes: {},
};

const Template = args => <SettingsSection { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	onPrivacyChange: action( 'onPrivacyChange' ),
};
