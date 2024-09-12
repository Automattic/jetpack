export function getFeatureAvailability( feature: string ): boolean {
	return window?.Jetpack_Editor_Initial_State?.available_blocks?.[ feature ]?.available === true;
}
