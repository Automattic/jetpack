import { getScriptData } from '@automattic/jetpack-script-data';

export const isOfflineFeatures = (): boolean =>
	Boolean( window?.myJetpackInitialState?.isOfflineFeatures );

export const getOfflineFeaturesSeed = (): OfflineFeaturesSeed | undefined =>
	( getScriptData()?.myJetpack as OfflineFeaturesScriptData | undefined )?.offlineFeatures;
