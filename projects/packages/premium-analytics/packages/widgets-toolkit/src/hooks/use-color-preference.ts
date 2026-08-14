type ColorPreference = {
	preferences: {
		interfaceTheme: 'default' | 'custom';
	};
};

/**
 * Local stand-in for `useColorPreference` from `@automattic/admin-toolkit`
 * (CIAB Admin), which is not published to npm. Jetpack Premium Analytics has
 * no interface-theme preference yet, so this always reports the default
 * theme, which maps to the standard WOO_COLORS chart palette in
 * `useChartTheme`.
 *
 * TODO: Wire this to a real interface-theme preference once the host
 * dashboard exposes one (or replace with the `@automattic/admin-toolkit`
 * hook if it becomes available).
 */
export function useColorPreference(): ColorPreference {
	return {
		preferences: {
			interfaceTheme: 'default',
		},
	};
}
