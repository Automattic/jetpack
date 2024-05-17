import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => (
		<div
			id="Tock_widget_container"
			data-tock-display-mode="Button"
			data-tock-color-mode="Blue"
			data-tock-locale="en-us"
			data-tock-timezone="America/New_York"
		></div>
	),
} );
