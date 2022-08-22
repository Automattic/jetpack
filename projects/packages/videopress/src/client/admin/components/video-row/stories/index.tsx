import VideoRow from '..';
import styles from '../style.module.scss';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Row',
	component: VideoRow,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta< typeof VideoRow >;

const Template: ComponentStory< typeof VideoRow > = () => {
	return (
		<div className={ styles[ 'storybook-wrapper' ] }>
			<VideoRow />
		</div>
	);
};

export const _default = Template.bind( {} );
