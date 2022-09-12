/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import { FilterButton } from '..';
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

const VideoFilterButtonTemplate: ComponentStory< typeof FilterButton > = FilterButton;

export const filterButton = VideoFilterButtonTemplate.bind( {} );
filterButton.args = {
	onToggle: action( 'onToggle' ),
};
