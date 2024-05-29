/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import { FilterButton, FilterSection, CheckboxCheckmark } from '..';
/**
 * Types
 */
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Filter',
	component: FilterButton,
	parameters: {
		layout: 'centered',
	},
} as Meta< typeof FilterButton >;

const VideoFilterSectionTemplate: StoryFn< typeof FilterSection > = FilterSection;
export const filterSection = VideoFilterSectionTemplate.bind( {} );
filterSection.args = {};

const VideoFilterButtonTemplate: StoryFn< typeof FilterButton > = FilterButton;
export const filterButton = VideoFilterButtonTemplate.bind( {} );
filterButton.args = {
	isActive: false,
	onClick: action( 'onClick' ),
};

const CheckboxCheckmarkButtonTemplate: StoryFn< typeof CheckboxCheckmark > = CheckboxCheckmark;
export const checkboxCheckmark = CheckboxCheckmarkButtonTemplate.bind( {} );
checkboxCheckmark.args = {
	label: 'Is it checked?',
};
