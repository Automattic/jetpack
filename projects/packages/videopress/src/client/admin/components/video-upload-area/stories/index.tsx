import { useBreakpointMatch } from '@automattic/jetpack-components';
import classnames from 'classnames';
import VideoUploadArea from '..';
import Doc from './VideoUploadArea.mdx';
import styles from './style.module.scss';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Upload Area',
	component: VideoUploadArea,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof VideoUploadArea >;

const noop = () => {
	//
};

const Template: ComponentStory< typeof VideoUploadArea > = args => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	return (
		<VideoUploadArea
			{ ...args }
			className={ classnames( styles.container, {
				[ styles.small ]: isSm,
			} ) }
			onSelectFiles={ noop }
		/>
	);
};

export const _default = Template.bind( {} );
