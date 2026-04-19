/**
 * Self-managing "New" / "Beta" badges, gated by the new-features registry.
 *
 * `<NewBadge feature="jetpack-ai" />` renders a green `@wordpress/ui` Badge
 * while the feature is flagged in `lib/new-features` AND within its window.
 * Past the window, the component returns null — no consumer change required.
 *
 * Use these instead of inline `<Badge>New</Badge>` so feature ageing is
 * centralised and translator strings are consistent.
 */

import { _x } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { useNewFeature } from 'lib/new-features';

type Props = {
	/** Slug registered in `lib/new-features`. */
	feature: string;
};

/**
 * Renders a "New" badge while `feature` is flagged as new.
 *
 * @param props         - Component props.
 * @param props.feature - Slug registered in `lib/new-features`.
 * @return The Badge, or null when the feature isn't flagged or has expired.
 */
export function NewBadge( { feature }: Props ) {
	if ( ! useNewFeature( feature, 'new' ) ) {
		return null;
	}
	return (
		<Badge intent="stable">
			{ _x( 'New', 'Indicates a recently-launched feature.', 'jetpack' ) }
		</Badge>
	);
}

/**
 * Renders a "Beta" badge while `feature` is flagged with the beta variant.
 *
 * @param props         - Component props.
 * @param props.feature - Slug registered in `lib/new-features`.
 * @return The Badge, or null when the feature isn't flagged or has expired.
 */
export function BetaBadge( { feature }: Props ) {
	if ( ! useNewFeature( feature, 'beta' ) ) {
		return null;
	}
	return (
		<Badge intent="informational">
			{ _x( 'Beta', 'Indicates an experimental, not-yet-final feature.', 'jetpack' ) }
		</Badge>
	);
}
