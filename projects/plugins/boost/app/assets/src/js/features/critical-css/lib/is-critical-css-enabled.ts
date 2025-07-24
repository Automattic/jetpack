import { ModulesState } from '$features/module/lib/stores';

export const isCriticalCssEnabled = ( modulesState: ModulesState | undefined ) => {
	if ( modulesState?.cloud_css?.available ) {
		return modulesState?.cloud_css?.active ?? false;
	}

	return modulesState?.critical_css?.active ?? false;
};
