/**
 * Internal dependencies
 */
import VideosGrid from '..';
import { videos } from '../../../mock';
import Doc from './VideosGrid.mdx';
/**
 * Types
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Videos Grid',
	component: VideosGrid,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof VideosGrid >;

const Template: ComponentStory< typeof VideosGrid > = VideosGrid;

export const _default = Template.bind( {} );
_default.args = {
	videos: videos.map( video => ( {
		...video,
		title: video.videoTitle,
		duration: Math.floor(
			Math.random() * ( ( 3600 + 60 * 15 ) * 1000 - 25 * 1000 + 1 ) + 25 * 1000
		), // 25 seconds to 1 hour and 15 minutes
		plays: Math.floor( Math.random() * 1000000 ),
	} ) ),
	count: 6,
};
