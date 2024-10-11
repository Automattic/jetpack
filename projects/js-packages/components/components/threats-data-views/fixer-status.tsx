import { ExternalLink, Spinner } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { check } from '@wordpress/icons';
import IconTooltip from '../icon-tooltip';
import Text from '../text';
import { PAID_PLUGIN_SUPPORT_URL } from './constants';
import styles from './styles.module.scss';
import { ThreatFixStatus } from './types';
import { fixerStatusIsStale } from './utils';

/**
 * InfoIconTooltip component.
 *
 * @param {object}  props         - Component props.
 * @param {boolean} props.message - The popover message.
 * @param {object}  props.size    - The size of the icon.
 *
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
		<IconTooltip
			placement={ 'top' }
			className={ styles[ 'icon-tooltip__container' ] }
			iconClassName={ styles[ 'icon-tooltip__icon' ] }
			iconSize={ size }
			hoverShow={ true }
		>
			<Text variant={ 'body-small' }>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: Number of hide items  */
						__( '%s Please try again or <supportLink>contact support</supportLink>.', 'jetpack' ),
						message
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
			</Text>
		</IconTooltip>
	);
}

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
		return (
			<div className={ styles[ 'icon-spinner' ] }>
				<Spinner color="black" />
			</div>
		);
	}

	return <Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } />;
}

/**
 * FixerStatusText component.
 *
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 *
 * @return {JSX.Element} The component.
 */
function FixerStatusText( { fixer }: { fixer?: ThreatFixStatus } ): JSX.Element {
	if ( fixer && fixerStatusIsStale( fixer ) ) {
		return (
			<span className={ styles[ 'info-spacer' ] }>
				{ __( 'Fixer is taking longer than expected', 'jetpack' ) }
			</span>
		);
	}

	if ( fixer && 'error' in fixer && fixer.error ) {
		return (
			<span className={ styles[ 'info-spacer' ] }>
				{ __( 'An error occurred auto-fixing this threat', 'jetpack' ) }
			</span>
		);
	}

	if ( fixer && 'status' in fixer && fixer.status === 'in_progress' ) {
		return <span className={ styles[ 'spinner-spacer' ] }>{ __( 'Auto-fixing', 'jetpack' ) }</span>;
	}

	return <span className={ styles[ 'check-spacer' ] }>{ __( 'Auto-fixable', 'jetpack' ) }</span>;
}

/**
 * FixerStatusBadge component.
 *
 * @param {object}  props       - Component props.
 * @param {boolean} props.fixer - The fixer status.
 *
 * @return {string} The component.
 */
export function FixerStatusBadge( { fixer }: { fixer?: ThreatFixStatus } ): JSX.Element {
	return (
		<div className={ styles[ 'fixer-status' ] }>
			<FixerStatusIcon fixer={ fixer } />
			<FixerStatusText fixer={ fixer } />
		</div>
	);
}
