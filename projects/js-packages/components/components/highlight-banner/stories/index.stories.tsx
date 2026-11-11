import { Button } from '@wordpress/components';
import HighlightBanner from '../index.tsx';
import type { Meta, StoryFn } from '@storybook/react';

const meta: Meta< typeof HighlightBanner > = {
	title: 'JS Packages/Components/Highlight Banner',
	component: HighlightBanner,
	argTypes: {
		actions: { table: { disable: true } },
	},
};

export default meta;

const Template: StoryFn< typeof HighlightBanner > = args => <HighlightBanner { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	title: 'Do more on your site with AI.',
	description:
		'Write, edit, and make changes across your whole site. Start in the editor, or connect an assistant you already use.',
};

export const WithActions = Template.bind( {} );
WithActions.args = {
	...Default.args,
	actions: (
		<>
			<Button className="jp-highlight-banner__cta" variant="primary">
				Get started
			</Button>
			<Button className="jp-highlight-banner__secondary" variant="tertiary">
				Close
			</Button>
		</>
	),
	onDismiss: () => {},
};
