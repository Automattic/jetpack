export default function usePublicizeConfig() {
	return {
		isRePublicizeFeatureEnabled: !! window?.Jetpack_Editor_Initial_State.jetpack
			?.republicize_enabled,
	};
}
