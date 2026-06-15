import { connect } from 'react-redux';
import {
	activateModule as activateModuleAction,
	deactivateModule as deactivateModuleAction,
	fetchModules as fetchModulesAction,
} from 'state/modules';
import { OfflineMode } from './component';

export { OfflineMode };

export default connect( null, {
	activateModule: activateModuleAction,
	deactivateModule: deactivateModuleAction,
	fetchModules: fetchModulesAction,
} )( OfflineMode );
