import { getThreatType, type Threat } from '@automattic/jetpack-scan';
import { code, color, plugins, shield, wordpress } from '@wordpress/icons';
import { Icon } from '@wordpress/ui';
import type { ScanThreat } from './types';

const ICONS = { plugins, themes: color, core: wordpress, file: code };

/**
 * The plugin's WordPress.org icon or theme screenshot, else an icon for the kind of threat.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @param props.size   - Width and height in pixels.
 * @return The media.
 */
export default function ThreatMedia( { threat, size }: { threat: ScanThreat; size: number } ) {
	const src = threat.extension?.icon;
	if ( src ) {
		return (
			<img
				className="jp-protect-threat-media"
				src={ src }
				alt=""
				width={ size }
				height={ size }
				loading="lazy"
			/>
		);
	}
	return (
		<span
			className="jp-protect-threat-media is-icon"
			style={ { inlineSize: size, blockSize: size } }
		>
			<Icon icon={ ICONS[ getThreatType( threat as Threat ) ] ?? shield } size={ size * 0.6 } />
		</span>
	);
}
