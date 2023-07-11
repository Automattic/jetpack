import { useState } from 'react';
import PricingSlider from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Pricing Slider',
	component: PricingSlider,
} as ComponentMeta< typeof PricingSlider >;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof PricingSlider > = args => <PricingSlider { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

// Export additional stories using chaning values
const TemplateWithChangingValue: ComponentStory< typeof PricingSlider > = args => {
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
			<PricingSlider
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
