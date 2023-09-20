import { modulesState } from '../stores/modules';

export default function enableCloudCss() {
	// Enable cloud css module on upgrade.
	modulesState.update( oldValue => {
		return { ...oldValue, cloud_css: { ...oldValue.cloud_css, active: true } };
	} );
}
