import { useState } from 'react';
import VideoRow from '..';
import styles from '../style.module.scss';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Row',
	component: VideoRow,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div className={ styles[ 'storybook-wrapper' ] }>
				<Story />
			</div>
		),
	],
} as ComponentMeta< typeof VideoRow >;

const Template: ComponentStory< typeof VideoRow > = args => {
	const [ checked, setChecked ] = useState( false );
	const onSelect = current => setChecked( current );
	return <VideoRow { ...args } checked={ checked } onSelect={ onSelect } />;
};

export const _default = Template.bind( {} );
_default.args = {
	posterImage:
		'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg',
	title: 'videopress-upload-demo-7-mp4',
	duration: 158633,
	plays: 200,
	uploadDate: '2022-08-15T21:16:59+0000',
	isPrivate: true,
	hideEditButton: false,
	hideQuickActions: false,
};
