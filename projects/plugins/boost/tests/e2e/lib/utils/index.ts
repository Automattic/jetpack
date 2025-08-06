import { TestUtils } from '_jetpack-e2e-commons/utils/index.ts';
import {
	executeJetpackBoostCommand,
	activateBoostModule,
	deactivateBoostModule,
} from './boost-utils.ts';

class BoostUtils extends TestUtils {
	executeJetpackBoostCommand: typeof executeJetpackBoostCommand = executeJetpackBoostCommand;
	activateBoostModule: typeof activateBoostModule = activateBoostModule;
	deactivateBoostModule: typeof deactivateBoostModule = deactivateBoostModule;
	// enableInstantSearch: typeof enableInstantSearch = enableInstantSearch;
	// disableInstantSearch: typeof disableInstantSearch = disableInstantSearch;
	// setResultFormat: typeof setResultFormat = setResultFormat;
	// setTheme: typeof setTheme = setTheme;
	// setHighlightColor: typeof setHighlightColor = setHighlightColor;
	// setDefaultSort: typeof setDefaultSort = setDefaultSort;
	// searchAutoConfig: typeof searchAutoConfig = searchAutoConfig;
	// clearSearchPlanInfo: typeof clearSearchPlanInfo = clearSearchPlanInfo;
}

export { BoostUtils };
