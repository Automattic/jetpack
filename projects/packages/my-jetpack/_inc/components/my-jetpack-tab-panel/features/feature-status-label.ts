import { __ } from '@wordpress/i18n';

/**
 * The label for a feature's Active/Inactive badge.
 *
 * Both strings are bound before the branch so minification cannot fold the two `__()` calls
 * into one with a ternary msgid, which the i18n build check rejects.
 *
 * @param isActive - Whether the feature is active.
 * @return The badge label.
 */
export function featureStatusLabel( isActive: boolean ): string {
	const activeLabel = __( 'Active', 'jetpack-my-jetpack' );
	const inactiveLabel = __( 'Inactive', 'jetpack-my-jetpack' );

	return isActive ? activeLabel : inactiveLabel;
}
