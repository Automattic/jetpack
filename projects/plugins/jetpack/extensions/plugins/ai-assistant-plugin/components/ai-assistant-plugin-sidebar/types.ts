import { PLACEMENT_DOCUMENT_SETTINGS, PLACEMENT_JETPACK_SIDEBAR } from './constants';

export type JetpackSettingsContentProps = {
	placement: typeof PLACEMENT_JETPACK_SIDEBAR | typeof PLACEMENT_DOCUMENT_SETTINGS;
	requireUpgrade: boolean;
	upgradeType: string;
};

export type CoreSelect = {
	getPostType: ( postTypeName: string ) => {
		viewable: boolean;
	};
};
