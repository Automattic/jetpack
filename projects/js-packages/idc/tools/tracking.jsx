/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';

/**
 * This function will fire both a Tracks and MC stat.
 * It will make sure to format the event name properly for the given stat home.
 *
 * Tracks Will be prefixed by 'jetpack_idc_' and use underscores.
 * MC Will not be prefixed, and will use dashes.
 *
 * @param {string} eventName - name.
 * @param {object} extraProps - extra props.
 */
export default function trackAndBumpMCStats( eventName, extraProps = {} ) {
	if ( 'undefined' === typeof extraProps || 'object' !== typeof extraProps ) {
		extraProps = {};
	}

	if (
		eventName &&
		eventName.length &&
		'undefined' !== typeof analytics &&
		analytics.tracks &&
		analytics.mc
	) {
		// Format for Tracks
		eventName = eventName.replace( /-/g, '_' );
		eventName = eventName.indexOf( 'jetpack_idc_' ) !== 0 ? 'jetpack_idc_' + eventName : eventName;
		analytics.tracks.recordEvent( eventName, extraProps );

		// Now format for MC stats
		eventName = eventName.replace( 'jetpack_idc_', '' );
		eventName = eventName.replace( /_/g, '-' );
		analytics.mc.bumpStat( 'jetpack-idc', eventName );
	}
}
