import { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';
import {
	clearSearchPlanInfo,
	disableInstantSearch,
	enableInstantSearch,
	searchAutoConfig,
	setDefaultSort,
	setHighlightColor,
	setResultFormat,
	setTheme,
} from './search-utils';

class SearchUtils extends TestUtils {
	enableInstantSearch: typeof enableInstantSearch = enableInstantSearch;
	disableInstantSearch: typeof disableInstantSearch = disableInstantSearch;
	setResultFormat: typeof setResultFormat = setResultFormat;
	setTheme: typeof setTheme = setTheme;
	setHighlightColor: typeof setHighlightColor = setHighlightColor;
	setDefaultSort: typeof setDefaultSort = setDefaultSort;
	searchAutoConfig: typeof searchAutoConfig = searchAutoConfig;
	clearSearchPlanInfo: typeof clearSearchPlanInfo = clearSearchPlanInfo;
}

export { SearchUtils };
