import DonutMeter from '../index';

export default {
	title: 'JS Packages/Components/DonutMeter',
	component: DonutMeter,
	parameters: {
		layout: 'centered',
	},
};

export const Default = () => (
	<DonutMeter
		segmentCount={ 16 }
		totalCount={ 100 }
		thickness="3.5"
		donutWidth="64px"
		title="Meter title goes here"
		description="Meter description goes here"
	/>
);

export const Warning = () => (
	<DonutMeter
		segmentCount={ 16 }
		totalCount={ 100 }
		thickness="3.5"
		donutWidth="64px"
		title="Meter title goes here"
		description="Meter description goes here"
		type="warning"
	/>
);

export const Danger = () => (
	<DonutMeter
		segmentCount={ 16 }
		totalCount={ 100 }
		thickness="3.5"
		donutWidth="64px"
		title="Meter title goes here"
		description="Meter description goes here"
		type="danger"
	/>
);

export const AdaptiveColors = () => (
	<div>
		<div style={ { display: 'flex', flexFlow: 'row' } }>
			<DonutMeter
				segmentCount={ 20 }
				totalCount={ 100 }
				thickness="3.5"
				donutWidth="64px"
				title="Meter title goes here"
				description="Meter description goes here"
				useAdaptiveColors
			/>
			<DonutMeter
				segmentCount={ 40 }
				totalCount={ 100 }
				thickness="3.5"
				donutWidth="64px"
				title="Meter title goes here"
				description="Meter description goes here"
				useAdaptiveColors
			/>
			<DonutMeter
				segmentCount={ 60 }
				totalCount={ 100 }
				thickness="3.5"
				donutWidth="64px"
				title="Meter title goes here"
				description="Meter description goes here"
				useAdaptiveColors
			/>
			<DonutMeter
				segmentCount={ 80 }
				totalCount={ 100 }
				thickness="3.5"
				donutWidth="64px"
				title="Meter title goes here"
				description="Meter description goes here"
				useAdaptiveColors
			/>
			<DonutMeter
				segmentCount={ 100 }
				totalCount={ 100 }
				thickness="3.5"
				donutWidth="64px"
				title="Meter title goes here"
				description="Meter description goes here"
				useAdaptiveColors
			/>
		</div>
		<p>Color changing according to the fullness of the meter.</p>
	</div>
);
