import type { Meta } from '@storybook/react';
import QualityControl from '../quality-control';
import React from 'react';

const meta: Meta< typeof QualityControl > = {
	title: 'Plugins/Boost/Image CDN/QualityControl',
	component: QualityControl,
	argTypes: {
		label: {control: 'text'},
		"config.lossless": {control: 'boolean'},
		"config.quality": {control: 'number'},
		maxValue: {control: 'number'},
		minValue: {number: 'number'},
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
	"config.lossless": false,
	"config.quality": 75,
	maxValue: 80,
	minValue: 20,
};

export default meta;

const Template = args => {
	const [config, setConfig] = React.useState( {
		lossless: args["config.lossless"],
		quality: args["config.quality"],
	} );

	React.useEffect( () => {
		setConfig( {
			lossless: args["config.lossless"],
			quality: args["config.quality"],
		} );
	}, [args["config.lossless"], args["config.quality"]] );

	const props = {
		label: args.label,
		config,
		maxValue: args.maxValue,
		minValue: args.minValue,
	}
	return <QualityControl { ...props } onChange={(newVal) => setConfig(newVal)} />
};
export const _default = Template.bind( {} );
_default.args = defaultValues;
