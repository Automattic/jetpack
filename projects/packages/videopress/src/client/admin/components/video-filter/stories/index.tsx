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
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Filter',
	component: FilterButton,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta< typeof FilterButton >;

const VideoFilterSectionTemplate: ComponentStory< typeof FilterSection > = FilterSection;
export const filterSection = VideoFilterSectionTemplate.bind( {} );
filterSection.args = {};

const VideoFilterButtonTemplate: ComponentStory< typeof FilterButton > = FilterButton;
export const filterButton = VideoFilterButtonTemplate.bind( {} );
filterButton.args = {
	isActive: false,
	onClick: action( 'onClick' ),
};

const CheckboxCheckmarkButtonTemplate: ComponentStory<
	typeof CheckboxCheckmark
> = CheckboxCheckmark;
export const checkboxCheckmark = CheckboxCheckmarkButtonTemplate.bind( {} );
checkboxCheckmark.args = {
	label: 'Is it checked?',
};
