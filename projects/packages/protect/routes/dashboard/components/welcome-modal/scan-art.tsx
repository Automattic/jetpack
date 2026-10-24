import { __ } from '@wordpress/i18n';
import { Icon, check, color, plugins, shield, wordpress } from '@wordpress/icons';
import './scan-art.scss';
import type { CSSProperties, ReactElement } from 'react';

const SWEEP_SECONDS = 2.4;

// The sweep starts at 12 o'clock (-90deg) and turns clockwise.
const SWEEP_START = -90;

/**
 * What a scan checks, with the icons the threat list uses, placed around the radar.
 *
 * @return Icon, label and angle per scanned thing.
 */
const getTargets = () => [
	// "WordPress" is a product name and is not translated.
	{ icon: wordpress, label: 'WordPress', angle: -30 },
	{ icon: plugins, label: __( 'Plugins', 'jetpack-protect-pkg' ), angle: 90 },
	{ icon: color, label: __( 'Themes', 'jetpack-protect-pkg' ), angle: 210 },
];

/**
 * Position a target on the ring, and time its ping to the moment the sweep reaches it.
 *
 * @param angle - Clockwise from 3 o'clock, in degrees.
 * @return Custom properties for the blip.
 */
const blipStyle = ( angle: number ) =>
	( {
		'--jp-protect-angle': `${ angle }deg`,
		'--jp-protect-delay': `${
			( ( ( ( angle - SWEEP_START ) % 360 ) + 360 ) % 360 ) * ( SWEEP_SECONDS / 360 )
		}s`,
	} ) as CSSProperties;

/**
 * Header art for the guide's Scan page: one radar sweep that checks off WordPress, plugins and themes.
 *
 * @return The art.
 */
export default function ScanArt(): ReactElement {
	return (
		<span
			className="jp-protect-scan-art"
			style={ { '--jp-protect-sweep': `${ SWEEP_SECONDS }s` } as CSSProperties }
		>
			<span className="jp-protect-scan-art__ring" />
			<span className="jp-protect-scan-art__ring is-inner" />
			<span className="jp-protect-scan-art__sweep" />
			{ getTargets().map( target => (
				<span
					key={ target.label }
					className="jp-protect-scan-art__blip"
					style={ blipStyle( target.angle ) }
				>
					<Icon icon={ target.icon } size={ 20 } />
					<span className="jp-protect-scan-art__check">
						<Icon icon={ check } size={ 16 } />
					</span>
				</span>
			) ) }
			<span className="jp-protect-welcome__art-badge is-small">
				<Icon icon={ shield } size={ 32 } />
			</span>
		</span>
	);
}
