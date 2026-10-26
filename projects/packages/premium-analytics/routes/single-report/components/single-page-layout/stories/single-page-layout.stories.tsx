/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { applyFixtureSiteSettings } from '../../../../../packages/widgets-toolkit/src/stories/fixture-site';
import { buildControlFields } from '../../../controls';
import { videoHeaderSlots, type VideoSummary } from '../../../pages/video';
import { SinglePageLayout } from '../single-page-layout';
import { POSTER, UPLOAD_DATE } from './fixtures';
import styles from './single-page-layout.stories.module.scss';
import { useStoryWindow, type StoryWindowArgs } from './story-window';
import type { Meta, StoryObj } from '@storybook/react';

applyFixtureSiteSettings();

type SinglePageLayoutStoryArgs = Pick< StoryWindowArgs, 'preset' > & {
	/*
	 * The video's title; blank renders the adapter's fallback.
	 */
	title: string;

	/*
	 * The poster URL; blank shows the video glyph.
	 */
	posterUrl: string;

	/*
	 * The upload date the summary states; blank drops the upload sentence and the All time anchor.
	 */
	uploadDate: string;

	/*
	 * The summary's state.
	 */
	status: 'ready' | 'loading' | 'not-found' | 'error';

	/*
	 * Whether the record declares date controls.
	 */
	withControls: boolean;
};

/**
 * The layout as the stage composes it under `Page`: the video adapter's header over a
 * summary, the record's controls, and a tall body so the header pins when the frame scrolls.
 *
 * @param {SinglePageLayoutStoryArgs} props - The props.
 * @return The layout in a scrolling frame.
 */
function SinglePageLayoutStory( {
	title,
	posterUrl,
	uploadDate,
	status,
	withControls,
	preset,
}: SinglePageLayoutStoryArgs ) {
	const summary: VideoSummary = {
		title: title || undefined,
		publishedDate: uploadDate || undefined,
		allTimeStart: uploadDate || undefined,
		posterUrl: posterUrl || undefined,
		isLoading: status === 'loading',
		isError: status === 'error',
		error: status === 'error' ? { status: 500 } : undefined,
		isNotFound: status === 'not-found',
		refetch: () => {},
	};
	const { data, onChange, range } = useStoryWindow( {
		preset,
		allTimeStart: summary.allTimeStart,
	} );
	const header = videoHeaderSlots( summary, { label: 'Video', performanceRange: range } );
	const controls = useMemo(
		() => buildControlFields( withControls ? null : false ),
		[ withControls ]
	);

	return (
		// A single-report page offers no comparison; the stage sets the scope the same way.
		<ReportScopeProvider offersComparison={ false }>
			<div className={ styles.frame }>
				<SinglePageLayout
					visual={ header.visual }
					title={ header.title }
					subTitle={ header.subTitle }
					busy={ header.busy }
					controls={ controls as never }
					data={ data }
					onChange={ onChange }
				>
					<pre className={ styles.item }>{ JSON.stringify( data, null, 2 ) }</pre>
					<div className={ styles.filler } />
				</SinglePageLayout>
			</div>
		</ReportScopeProvider>
	);
}

const meta: Meta< typeof SinglePageLayoutStory > = {
	title: 'Packages/Premium Analytics/Routes/Single Report/SinglePageLayout',
	component: SinglePageLayoutStory,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The body of a single-report page under `Page`: a pinned header with the slots the ' +
					'page adapter builds from the entity summary (visual, title, subtitle), the date ' +
					'controls the record declares, and the content scrolling under it. Here the video ' +
					'adapter renders the header over a summary the controls describe.',
			},
		},
	},
	args: {
		title: 'Launch recap',
		posterUrl: POSTER,
		uploadDate: UPLOAD_DATE,
		status: 'ready',
		withControls: true,
		preset: 'last-30-days',
	},
	argTypes: {
		status: { control: 'radio', options: [ 'ready', 'loading', 'not-found', 'error' ] },
		preset: { control: 'radio', options: [ 'last-7-days', 'last-30-days', 'all-time' ] },
	},
	// The window seeds from the preset, so changing the control remounts the story.
	render: args => <SinglePageLayoutStory key={ args.preset } { ...args } />,
};
export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {};

export const WithoutPoster: Story = {
	args: { posterUrl: '' },
};

export const Loading: Story = {
	args: { status: 'loading' },
};

export const NotFound: Story = {
	args: { status: 'not-found' },
};

export const LongTitle: Story = {
	args: { title: `VID_20260731_${ 'a'.repeat( 80 ) }.mp4` },
};

export const WithoutControls: Story = {
	args: { withControls: false },
};
