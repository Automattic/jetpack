import { ExternalLink, Spinner } from '@wordpress/components';
import { View } from '@wordpress/dataviews';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { check, info } from '@wordpress/icons';
import { PAID_PLUGIN_SUPPORT_URL } from './constants';
import IconTooltip from './icon-tooltip';
import styles from './styles.module.scss';
import { ThreatFixStatus } from './types';
import { fixerStatusIsStale } from './utils';

/**
 * Fixer Status component.
 *
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 * @param {number}  props.size  - The size of the icon.
 *
 * @return {JSX.Element} The component.
 */
export default function FixerStatusIcon( {
	fixer,
	size = 24,
}: {
	fixer?: ThreatFixStatus;
	size?: number;
} ): JSX.Element {
	if ( fixer && fixerStatusIsStale( fixer ) ) {
		return (
			<IconTooltip
				icon={ info }
				iconClassName={ styles[ 'icon-info' ] }
				iconSize={ size }
				text={ createInterpolateElement(
					__(
						'The fixer is taking longer than expected. Please try again or <supportLink>contact support</supportLink>.',
						'jetpack'
					),
					{
						supportLink: (
							<ExternalLink
								className={ styles[ 'support-link' ] }
								href={ PAID_PLUGIN_SUPPORT_URL }
							/>
						),
					}
				) }
			/>
		);
	}

	if ( fixer && 'error' in fixer && fixer.error ) {
		return (
			<IconTooltip
				icon={ info }
				iconClassName={ styles[ 'icon-info' ] }
				iconSize={ 24 }
				text={ createInterpolateElement(
					__(
						'An error occurred auto-fixing this threat. Please try again or <supportLink>contact support</supportLink>.',
						'jetpack'
					),
					{
						supportLink: (
							<ExternalLink
								className={ styles[ 'support-link' ] }
								href={ PAID_PLUGIN_SUPPORT_URL }
							/>
						),
					}
				) }
			/>
		);
	}

	if ( fixer && 'status' in fixer && fixer.status === 'in_progress' ) {
		return <Spinner color="black" />;
	}

	return <Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } />;
}

/**
 * FixerStatusText component.
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 * @return {string} The component.
 */
function FixerStatusText( { fixer }: { fixer?: ThreatFixStatus } ): string {
	if ( fixer && fixerStatusIsStale( fixer ) ) {
		return __( 'Fixer is taking longer than expected', 'jetpack' );
	}

	if ( fixer && 'error' in fixer && fixer.error ) {
		return __( 'Error auto-fixing threat', 'jetpack' );
	}

	if ( fixer && 'status' in fixer && fixer.status === 'in_progress' ) {
		return __( 'Auto-fix in progress', 'jetpack' );
	}

	return __( 'Auto-fixable', 'jetpack' );
}

/**
 * FixerStatusBadge component.
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 * @return {string} The component.
 */
export function FixerStatusBadge( { fixer }: { fixer?: ThreatFixStatus } ): JSX.Element {
	return (
		<div className={ styles[ 'fixer-status-badge' ] }>
			<FixerStatusIcon fixer={ fixer } size={ 12 } />
			<FixerStatusText fixer={ fixer } />
		</div>
	);
}

/**
 * FixerStatusText component.
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 * @param {object}  props.view  - The view.
 * @return {string} The component.
 */
export function DataViewFixerStatus( {
	fixer,
	view,
}: {
	fixer?: ThreatFixStatus;
	view: View;
} ): JSX.Element {
	if ( view.type === 'table' ) {
		return (
			<div className={ styles.threat__fixer }>
				<FixerStatusIcon fixer={ fixer } />
			</div>
		);
	}

	return <FixerStatusBadge fixer={ fixer } />;
}
