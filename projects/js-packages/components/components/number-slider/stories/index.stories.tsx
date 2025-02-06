import { useState } from 'react';
import NumberSlider from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Number Slider',
	component: NumberSlider,
} as Meta< typeof NumberSlider >;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof NumberSlider > = args => <NumberSlider { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

// Export additional stories using chaning values
const TemplateWithChangingValue: StoryFn< typeof NumberSlider > = args => {
	const [ value, setValue ] = useState( 10 );
	const [ endValue, setEndValue ] = useState( 10 );
	const renderThumb = ( props, state ) => {
		return (
			<div { ...props }>
				{ state.valueNow } - { state.valueNow % 2 === 0 ? 'Even' : 'Odd' }
			</div>
		);
	};

	return (
		<div>
			<NumberSlider
				{ ...args }
				value={ value }
				onChange={ setValue }
				onAfterChange={ setEndValue }
				renderThumb={ renderThumb } // eslint-disable-line react/jsx-no-bind
			/>
			<div>{ `Value on changing: ${ value }` }</div>
			<div>{ `Value on change ends: ${ endValue }` }</div>
		</div>
	);
};

// Export With Default Value story
export const WithDefaultValue = TemplateWithChangingValue.bind( {} );
