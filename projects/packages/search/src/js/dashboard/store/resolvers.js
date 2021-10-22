import { fetchJetpackSetttings } from './controls';
import actions from './actions';

export function* getSearchModuleStatus() {
	const settings = yield fetchJetpackSetttings();
	if ( settings ) {
		return actions.setJetpackSettings( settings );
	}
	return;
}

export default { getSearchModuleStatus };
