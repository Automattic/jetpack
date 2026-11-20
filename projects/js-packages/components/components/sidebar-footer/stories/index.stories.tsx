import { Button, Text } from '@wordpress/ui';
import SidebarFooter from '../index.tsx';
import type { Meta, StoryFn } from '@storybook/react';

const meta: Meta< typeof SidebarFooter > = {
	title: 'JS Packages/Components/Sidebar Footer',
	component: SidebarFooter,
	argTypes: {
		children: { table: { disable: true } },
		description: { table: { disable: true } },
	},
	decorators: [
		Story => (
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					inlineSize: 360,
					blockSize: 400,
					overflow: 'auto',
					border: '1px solid #dcdcde',
				} }
			>
				<div style={ { padding: 16 } }>
					{ Array.from( { length: 8 }, ( _, index ) => (
						<p key={ index }>Sidebar content that scrolls under the footer.</p>
					) ) }
				</div>
				<Story />
			</div>
		),
	],
};

export default meta;

const Template: StoryFn< typeof SidebarFooter > = args => <SidebarFooter { ...args } />;

export const TwoActions = Template.bind( {} );
TwoActions.args = {
	children: (
		<>
			<Button variant="minimal" tone="neutral">
				Cancel
			</Button>
			<Button>Save</Button>
		</>
	),
};

export const OneAction = Template.bind( {} );
OneAction.args = {
	children: <Button variant="outline">Unignore it</Button>,
};

export const WithDescription = Template.bind( {} );
WithDescription.args = {
	...TwoActions.args,
	description: <Text variant="body-sm">Saving updates the search preview too.</Text>,
};
