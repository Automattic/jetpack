import type { Meta } from '@storybook/react';
import QualityControl from '../quality-control';
import { useState, useEffect } from 'react';

const meta: Meta< typeof QualityControl > = {
	title: 'Plugins/Boost/Image CDN/QualityControl',
	component: QualityControl,
	argTypes: {
		label: { control: 'text' },
		quality: { control: 'number' },
		lossless: { control: 'boolean' },
		maxValue: { control: 'number' },
		minValue: { control: 'number' },
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '600px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const defaultValues = {
	label: 'JPEG',
	quality: 75,
	lossless: false,
	maxValue: 80,
	minValue: 20,
};

export default meta;

const Template = args => {
	const [ quality, setQuality ] = useState( args.quality );
	const [ lossless, setLossless ] = useState( args.lossless );

	useEffect( () => {
		setQuality( args.quality );
	}, [ args.quality ] );

	useEffect( () => {
		setLossless( args.lossless );
	}, [ args.lossless ] );

	return (
		<QualityControl
			label={ args.label }
			quality={ quality }
			lossless={ lossless }
			setQuality={ setQuality }
			setLossless={ setLossless }
			maxValue={ args.maxValue }
			minValue={ args.minValue }
		/>
	);
};
export const _default = Template.bind( {} );
_default.args = defaultValues;
