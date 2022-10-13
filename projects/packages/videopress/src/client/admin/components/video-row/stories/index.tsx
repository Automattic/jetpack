import { useState } from 'react';
import { VideoRow } from '..';
import { postersArray, randomPoster } from '../../../mock';
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
	argTypes: {
		id: {
			table: {
				disable: true,
			},
		},
		onSelect: {
			table: {
				disable: true,
			},
		},
		onVideoDetailsClick: {
			table: {
				disable: true,
			},
		},
		className: {
			table: {
				disable: true,
			},
		},
		checked: {
			table: {
				disable: true,
			},
		},
		thumbnail: {
			control: { type: 'select', options: [ ...postersArray, 'none' ] },
		},
	},
} as ComponentMeta< typeof VideoRow >;

const Template: ComponentStory< typeof VideoRow > = args => {
	if ( args.thumbnail === 'none' ) {
		args.thumbnail = null;
	}

	const [ checked, setChecked ] = useState( false );
	const onSelect = current => setChecked( current );
	return <VideoRow { ...args } checked={ checked } onSelect={ onSelect } />;
};

export const _default = Template.bind( {} );
_default.args = {
	id: 1,
	thumbnail: randomPoster(),
	title: 'videopress-upload-demo-7-mp4',
	duration: 158633,
	plays: 200,
	uploadDate: '2022-08-15T21:16:59+0000',
	isPrivate: true,
	showEditButton: true,
	showQuickActions: true,
	loading: false,
};
