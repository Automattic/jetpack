import { _x } from '@wordpress/i18n';
import { configures, type SectionState } from '../types';

/**
 * "On" or "Off", for a section header.
 *
 * @param on - Whether the feature is on.
 * @return Badge text.
 */
export function onOffBadge( on: boolean ): string {
	return on
		? _x( 'On', 'Settings section status', 'jetpack-sharing-likes' )
		: _x( 'Off', 'Settings section status', 'jetpack-sharing-likes' );
}

/**
 * Status for a feature section, from the variant it renders.
 *
 * @param state - Section variant.
 * @return Badge text.
 */
export function featureBadge( state: SectionState ): string {
	if ( state === 'block_call_to_action' ) {
		return _x(
			'Block',
			'Settings section status: the feature now comes from its block',
			'jetpack-sharing-likes'
		);
	}

	return onOffBadge( configures( state ) );
}
