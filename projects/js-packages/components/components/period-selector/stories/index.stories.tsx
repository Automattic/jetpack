import { useCallback, useState } from 'react';
import PeriodSelector from '../index.tsx';
import type { Meta, StoryFn } from '@storybook/react';

const meta: Meta< typeof PeriodSelector > = {
	title: 'JS Packages/Components/Period Selector',
	component: PeriodSelector,
	argTypes: {
		onChange: { table: { disable: true } },
		onPrevious: { table: { disable: true } },
		onNext: { table: { disable: true } },
	},
};

export default meta;

const presets = [
	{ value: '7', label: 'Last 7 days' },
	{ value: '30', label: 'Last 30 days' },
];

const Template: StoryFn< typeof PeriodSelector > = args => {
	const [ value, setValue ] = useState( args.value );
	return <PeriodSelector { ...args } value={ value } onChange={ setValue } />;
};

export const _default = Template.bind( {} );
_default.args = { presets, value: '7' };

export const Disabled = Template.bind( {} );
Disabled.args = { presets, value: '7', disabled: true };

const SteppingTemplate: StoryFn< typeof PeriodSelector > = args => {
	const [ value, setValue ] = useState( args.value );
	const [ offset, setOffset ] = useState( 0 );
	const onChange = useCallback( ( next: string ) => {
		setValue( next );
		setOffset( 0 );
	}, [] );
	const onPrevious = useCallback( () => setOffset( current => current + 1 ), [] );
	const onNext = useCallback( () => setOffset( current => current - 1 ), [] );
	return (
		<PeriodSelector
			{ ...args }
			value={ value }
			onChange={ onChange }
			onPrevious={ onPrevious }
			onNext={ onNext }
			isNextDisabled={ offset === 0 }
		/>
	);
};

export const WithPreviousAndNext = SteppingTemplate.bind( {} );
WithPreviousAndNext.args = { presets, value: '7' };
