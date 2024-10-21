import { ExternalLink, Spinner } from '@wordpress/components';
import { View } from '@wordpress/dataviews';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { check } from '@wordpress/icons';
import IconTooltip from '../icon-tooltip';
import Text from '../text';
import { PAID_PLUGIN_SUPPORT_URL } from './constants';
import styles from './styles.module.scss';
import { ThreatFixStatus } from './types';
import { fixerStatusIsStale } from './utils';

/**
 * Fixer Status component.
 *
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 *
 * @return {JSX.Element} The component.
 */
export default function FixerStatusIcon( { fixer }: { fixer?: ThreatFixStatus } ): JSX.Element {
	if ( fixer && fixerStatusIsStale( fixer ) ) {
		return (
			<InfoIconTooltip message={ __( 'The fixer is taking longer than expected.', 'jetpack' ) } />
		);
	}

	if ( fixer && 'error' in fixer && fixer.error ) {
		return (
			<InfoIconTooltip message={ __( 'An error occurred auto-fixing this threat.', 'jetpack' ) } />
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
 * @return {JSX.Element} The component.
 */
function FixerStatusText( { fixer }: { fixer?: ThreatFixStatus } ): JSX.Element {
	if ( fixer && fixerStatusIsStale( fixer ) ) {
		return <span>{ __( 'Fixer is taking longer than expected', 'jetpack' ) }</span>;
	}

	if ( fixer && 'error' in fixer && fixer.error ) {
		return <span>{ __( 'Error auto-fixing threat', 'jetpack' ) }</span>;
	}

	if ( fixer && 'status' in fixer && fixer.status === 'in_progress' ) {
		return <span>{ __( 'Auto-fix in progress', 'jetpack' ) }</span>;
	}

	return <span>{ __( 'Auto-fixable', 'jetpack' ) }</span>;
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
			<FixerStatusIcon fixer={ fixer } />
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
		return <FixerStatusIcon fixer={ fixer } />;
	}

	return <FixerStatusBadge fixer={ fixer } />;
}

/**
 * InfoIconTooltip component.
 * @param {object}  props         - Component props.
 * @param {boolean} props.message - The popover message.
 * @param {object}  props.size    - The size of the icon.
 * @return {JSX.Elenment} The component.
 */
export function InfoIconTooltip( {
	message,
	size = 20,
}: {
	message?: string;
	size?: number;
} ): JSX.Element {
	return (
		<IconTooltip placement={ 'top' } iconSize={ size }>
			<Text variant={ 'body-small' }>
				{ message }{ ' ' }
				{ createInterpolateElement(
					__( 'Please try again or <supportLink>contact support</supportLink>.', 'jetpack' ),
					{
						supportLink: (
							<ExternalLink
								className={ styles[ 'support-link' ] }
								href={ PAID_PLUGIN_SUPPORT_URL }
							/>
						),
					}
				) }
			</Text>
		</IconTooltip>
	);
}
