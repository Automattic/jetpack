/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import React from 'react';
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
