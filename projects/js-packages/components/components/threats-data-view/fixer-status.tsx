import { ExternalLink, Icon, Spinner } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, info } from '@wordpress/icons';
import { PAID_PLUGIN_SUPPORT_URL } from './constants';
import IconTooltip from './icon-tooltip';
import styles from './styles.module.scss';

/**
 * Fixer Status component.
 *
 * @param {object}  props                       - Component props.
 * @param {boolean} props.isActiveFixInProgress - Whether an active fix is in progress.
 * @param {boolean} props.isStaleFixInProgress  - Whether a stale fix is in progress.
 *
 * @return {JSX.Element} The component.
 */
export default function FixerStatus( {
	isActiveFixInProgress,
	isStaleFixInProgress,
}: {
	isActiveFixInProgress: boolean;
	isStaleFixInProgress: boolean;
} ): JSX.Element {
	if ( isStaleFixInProgress ) {
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

	if ( isActiveFixInProgress ) {
		return <Spinner color="black" />;
	}

	return <Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } />;
}
