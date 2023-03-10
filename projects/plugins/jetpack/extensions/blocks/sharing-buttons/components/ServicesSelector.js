import { CheckboxControl } from '@wordpress/components';

function ServicesSelector({ onServiceSelected, selectedServices, services }) {
	return (
		<ul>
			{Object.keys(services).map(service => (
				<li key={service}>
					<CheckboxControl
						onChange={() => onServiceSelected(service)}
						label={services[service]}
						checked={selectedServices.includes(service)}
					/>
				</li>
			))}
		</ul>
	);
}

ServicesSelector.defaultProps = {
	services: {},
	selectedServices: [],
	onServiceSelected: () => {},
};

export default ServicesSelector;
