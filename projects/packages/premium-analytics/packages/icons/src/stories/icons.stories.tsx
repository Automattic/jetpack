import { Icon, Stack } from '@wordpress/ui';
import * as icons from '../index';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof Icon > = {
	title: 'Packages/Premium Analytics/Icons',
	component: Icon,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj< typeof Icon >;

const iconEntries = Object.entries( icons );

export const AllIcons: Story = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				flexWrap: 'wrap',
				gap: 'var(--wpds-dimension-gap-xl)',
			} }
		>
			{ iconEntries.map( ( [ name, icon ] ) => (
				<Stack
					key={ name }
					direction="column"
					align="center"
					gap="sm"
					style={ {
						padding: 'var(--wpds-dimension-gap-lg)',
						border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
						borderRadius: 'var(--wpds-border-radius-sm)',
						minWidth: '100px',
					} }
				>
					<Icon icon={ icon } size={ 48 } />
					<span>{ name }</span>
				</Stack>
			) ) }
		</div>
	),
};
