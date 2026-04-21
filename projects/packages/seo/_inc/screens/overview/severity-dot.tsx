/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */

import type { CSSProperties, FC } from 'react';

export type Severity = 'critical' | 'moderate' | 'healthy';

interface Props {
	severity: Severity;
}

// WPDS decorative-icon tokens — the same rail `@wordpress/ui` Notice uses
// for its own status icon, so the dot reads as the matching Notice
// intent. Fallbacks track the Gutenberg ramp's `fgSurface3` values.
const COLOR: Record< Severity, string > = {
	critical: 'var(--wpds-color-fg-content-error-weak, #cc1818)',
	moderate: 'var(--wpds-color-fg-content-warning-weak, #926300)',
	healthy: 'var(--wpds-color-fg-content-success-weak, #007f30)',
};

/**
 * Minimal 8px status dot, coloured with the WPDS decorative-icon tokens
 * that back the Gutenberg colour system.
 * @param root0
 * @param root0.severity
 */
const SeverityDot: FC< Props > = ( { severity } ) => {
	const style: CSSProperties = {
		display: 'inline-block',
		width: 10,
		height: 10,
		borderRadius: '50%',
		background: COLOR[ severity ],
		flex: '0 0 auto',
	};
	return <span aria-hidden="true" style={ style } />;
};

export default SeverityDot;
