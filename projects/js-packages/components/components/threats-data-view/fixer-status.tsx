import { ExternalLink, Spinner } from '@wordpress/components';
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
 *
 * @return {JSX.Element} The component.
 */
export default function FixerStatus( { fixer }: { fixer?: ThreatFixStatus } ): JSX.Element {
	if ( fixer && fixerStatusIsStale( fixer ) ) {
		return (
			<IconTooltip
				icon={ info }
				iconClassName={ styles[ 'icon-info' ] }
				iconSize={ 24 }
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
