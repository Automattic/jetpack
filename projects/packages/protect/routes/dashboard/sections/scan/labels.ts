import { __, _n, sprintf } from '@wordpress/i18n';
import type { ScanState, ScanThreat } from './types';

const VULNERABLE_LABELS = {
	plugins: () => __( 'Vulnerable plugin', 'jetpack-protect-pkg' ),
	themes: () => __( 'Vulnerable theme', 'jetpack-protect-pkg' ),
	core: () => __( 'Vulnerable WordPress version', 'jetpack-protect-pkg' ),
};

/**
 * A threat's title as a kind ("Vulnerable plugin") and a subject ("WP Super Cache (1.6.3)").
 *
 * @param threat - The threat.
 * @return The two parts; the kind is empty when the title has none.
 */
export function getThreatLabel( threat: ScanThreat ): { kind: string; subject: string } {
	const { extension } = threat;
	const vulnerable = extension && VULNERABLE_LABELS[ extension.type ];
	if ( vulnerable ) {
		return {
			kind: vulnerable(),
			subject: extension.version ? `${ extension.name } (${ extension.version })` : extension.name,
		};
	}
	const title = threat.title ?? '';
	const split = title.indexOf( ': ' );
	return split > 0
		? { kind: title.slice( 0, split ), subject: title.slice( split + 2 ) }
		: { kind: '', subject: title };
}

/**
 * Labels for the links that update or deactivate the affected software.
 *
 * @param threat - The threat.
 * @return The `update` and `deactivate` labels.
 */
export function getSoftwareActionLabels( threat: ScanThreat ): {
	update: string;
	deactivate: string;
} {
	const type = threat.extension?.type;
	if ( type === 'core' ) {
		return {
			update: __( 'Update WordPress', 'jetpack-protect-pkg' ),
			deactivate: '',
		};
	}
	if ( type === 'themes' ) {
		return {
			update: __( 'Update theme', 'jetpack-protect-pkg' ),
			deactivate: __( 'Switch theme', 'jetpack-protect-pkg' ),
		};
	}
	return {
		update: __( 'Update plugin', 'jetpack-protect-pkg' ),
		deactivate: __( 'Deactivate plugin', 'jetpack-protect-pkg' ),
	};
}

/**
 * How many plugins and themes a scan checks, such as "23 plugins" and "5 themes".
 *
 * @param scan - The latest report.
 * @return The two phrases.
 */
export function getCheckedCounts( scan: ScanState ): { plugins: string; themes: string } {
	const plugins = scan.pluginsChecked ?? 0;
	const themes = scan.themesChecked ?? 0;
	return {
		plugins: sprintf(
			/* translators: %s is a number. */
			_n( '%s plugin', '%s plugins', plugins, 'jetpack-protect-pkg' ),
			plugins.toLocaleString()
		),
		themes: sprintf(
			/* translators: %s is a number. */
			_n( '%s theme', '%s themes', themes, 'jetpack-protect-pkg' ),
			themes.toLocaleString()
		),
	};
}
