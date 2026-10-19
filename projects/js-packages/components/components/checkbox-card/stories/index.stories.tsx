import { useCallback, useState } from 'react';
import CheckboxCard, { CheckboxCardGrid } from '../index.tsx';
import type { Meta, StoryFn } from '@storybook/react';

const meta: Meta< typeof CheckboxCard > = {
	title: 'JS Packages/Components/Checkbox Card',
	component: CheckboxCard,
	argTypes: {
		illustration: { table: { disable: true } },
		onChange: { table: { disable: true } },
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

const Template: StoryFn< typeof CheckboxCard > = args => {
	const [ checked, setChecked ] = useState( args.checked );
	const handleChange = useCallback( ( _name: string, next: boolean ) => setChecked( next ), [] );

	return (
		<div style={ { maxWidth: 360 } }>
			<CheckboxCard { ...args } checked={ checked } onChange={ handleChange } />
		</div>
	);
};

export const _default = Template.bind( {} );
_default.args = {
	id: 'placement-after-content',
	name: 'after_content',
	title: 'After the post content',
	illustration: <Wireframe />,
	checked: false,
};

export const WithPreviewLink = Template.bind( {} );
WithPreviewLink.args = {
	..._default.args,
	checked: true,
	previewUrl: '#',
};

export const Disabled = Template.bind( {} );
Disabled.args = {
	..._default.args,
	disabled: true,
};

export const Grid: StoryFn< typeof CheckboxCard > = () => {
	const [ selected, setSelected ] = useState< Record< string, boolean > >( {
		before_content: true,
	} );
	const handleChange = useCallback(
		( name: string, next: boolean ) => setSelected( prev => ( { ...prev, [ name ]: next } ) ),
		[]
	);

	return (
		<CheckboxCardGrid>
			<CheckboxCard
				id="placement-before-content"
				name="before_content"
				title="Before the post content"
				illustration={ <Wireframe before /> }
				checked={ Boolean( selected.before_content ) }
				onChange={ handleChange }
			/>
			<CheckboxCard
				id="placement-after-content"
				name="after_content"
				title="After the post content"
				illustration={ <Wireframe /> }
				checked={ Boolean( selected.after_content ) }
				onChange={ handleChange }
			/>
		</CheckboxCardGrid>
	);
};
