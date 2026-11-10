import { Field, RadioGroup } from '@wordpress/ui';
import { useState } from 'react';
import RadioCard, { RadioCardGrid } from '../index.tsx';
import type { Meta, StoryFn } from '@storybook/react';

const meta: Meta< typeof RadioCard > = {
	title: 'JS Packages/Components/Radio Card',
	component: RadioCard,
	argTypes: {
		illustration: { table: { disable: true } },
		onPreviewClick: { table: { disable: true } },
	},
};

export default meta;

const Wireframe = ( { before }: { before?: boolean } ) => {
	const top = before ? 56 : 24;
	return (
		<svg viewBox="0 0 294 192" aria-hidden="true">
			<rect x="40" y={ top } width="214" height="12" rx="2" fill="#dcdcde" />
			<rect x="40" y={ top + 24 } width="214" height="80" rx="2" fill="#f0f0f1" />
			<rect x="40" y={ before ? 24 : 140 } width="120" height="20" rx="4" fill="#3858e9" />
		</svg>
	);
};

const Template: StoryFn< typeof RadioCard > = args => {
	const [ value, setValue ] = useState< string >( 'after_content' );

	return (
		<Field.Root>
			<RadioGroup
				value={ value }
				onValueChange={ setValue }
				aria-label="Where the block goes"
				style={ { maxWidth: 736 } }
			>
				<RadioCardGrid>
					<RadioCard
						{ ...args }
						id="placement-before-content"
						value="before_content"
						title="Before the post content"
						illustration={ <Wireframe before /> }
					/>
					<RadioCard
						{ ...args }
						id="placement-after-content"
						value="after_content"
						title="After the post content"
						illustration={ <Wireframe /> }
					/>
				</RadioCardGrid>
			</RadioGroup>
		</Field.Root>
	);
};

export const _default = Template.bind( {} );
_default.args = {};

export const WithPreviewLink = Template.bind( {} );
WithPreviewLink.args = {
	previewUrl: '#',
};

export const Disabled = Template.bind( {} );
Disabled.args = {
	disabled: true,
};
