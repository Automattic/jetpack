import { WidgetCard } from '../../../stories/widget-card';
import { PostHighlightCardSkeleton } from '../post-highlight-card-skeleton';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof PostHighlightCardSkeleton > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/PostHighlightCardSkeleton',
	component: PostHighlightCardSkeleton,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"Loading shape for `PostHighlightCard`, passed through `WidgetState`'s `renderLoading` by the Latest post and Popular post widgets.",
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof PostHighlightCardSkeleton >;

/**
 * The shape on a tile with room for it: the post's two title lines above the
 * three stat columns, centred in the body. No thumbnail placeholder — the card
 * shows its featured image only when the post has one, and only above 520px.
 */
export const Skeleton: Story = {
	render: () => (
		<WidgetCard width="360px" height="320px">
			<PostHighlightCardSkeleton />
		</WidgetCard>
	),
};

/**
 * A height-1 dashboard tile. Too short to centre the shape, so it packs from
 * the top and the tail is clipped rather than pushed past the widget body.
 */
export const SkeletonShortTile: Story = {
	render: () => (
		<WidgetCard width="360px" height="140px">
			<PostHighlightCardSkeleton />
		</WidgetCard>
	),
};
