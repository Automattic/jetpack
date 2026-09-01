import {
	JETPACK_MODULES,
	JETPACK_PRODUCTS_WITH_CARD,
	JETPACK_PRODUCTS_WITHOUT_CARD,
} from './constants';

export type JetpackProductWithCard = ( typeof JETPACK_PRODUCTS_WITH_CARD )[ number ];

export type JetpackProductWithoutCard = ( typeof JETPACK_PRODUCTS_WITHOUT_CARD )[ number ];

export type JetpackProductSlug = JetpackProductWithCard | JetpackProductWithoutCard;

export type JetpackModuleSlug = ( typeof JETPACK_MODULES )[ number ];

export type MyJetpackModule = {
	available: boolean;
	module: string;
	name: string;
	activated: boolean;
	override?: false | 'active' | 'inactive';
	description: string;
	long_description: string;
	search_terms: string;
};

export type SiteEditorData = {
	isBlockTheme: boolean;
	isSharingBlockAvailable: boolean;
	activeThemeStylesheet: string;
};

declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		myJetpack?: {
			siteEditor: SiteEditorData;
		};
	}
}
