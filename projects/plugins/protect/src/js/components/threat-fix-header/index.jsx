import { Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import React, { useState, useCallback } from 'react';
import ThreatSeverityBadge from '../severity';
import styles from './styles.module.scss';

//TODO: Move this to WPCom like we did the other messages?
export const getFixerMessage = fixable => {
	switch ( fixable.fixer ) {
		case 'replace':
			return __( 'Jetpack Scan will replace the affected file or directory.', 'jetpack-protect' );
		case 'delete':
			return __( 'Jetpack Scan will delete the affected file or directory.', 'jetpack-protect' );
		case 'update':
			if ( fixable.target ) {
				return sprintf(
					/* translators: %s: Version that the plugin will be upgraded to  */
					__( 'Jetpack Scan will update to a newer version %s.', 'jetpack-protect' ),
					fixable.target
				);
			}
			return __( 'Jetpack Scan will update to a newer version.', 'jetpack-protect' );
		case 'edit':
			return __( 'Jetpack Scan will edit the affected file or directory.', 'jetpack-protect' );
		case 'rollback':
			if ( fixable.target ) {
				return sprintf(
					/* translators: %s: Version that the plugin will be upgraded to  */
					__(
						'Jetpack Scan will rollback the affected file to the version from %s.',
						'jetpack-protect'
					),
					fixable.target
				);
			}
			return __(
				'Jetpack Scan will rollback the affected file to an older (clean) version.',
				'jetpack-protect'
			);
		default:
			return __( 'Jetpack Scan will resolve the threat.', 'jetpack-protect' );
	}
};

/**
 * Threat Fix Header
 *
 * @param {object} props                  - Props.
 * @param {object} props.threat           - Threat object
 * @param {string} props.fixAllDialog     - Boolean indicating whether this is the fix all modal or not
 * @param {string} props.onCheckFix       - Callback called when checkbox is selected
 * @returns { React.ReactNode }           The Threat Fix Header component.
 */
export default function ThreatFixHeader( { threat, fixAllDialog, onCheckFix } ) {
	const [ checkedFix, setCheckedFix ] = useState( true );

	const checkFix = useCallback(
		event => {
			setCheckedFix( event.target.checked );
			onCheckFix( event.target.checked, threat );
		},
		[ onCheckFix, threat ]
	);

	return (
		<>
			<div className={ styles.threat }>
				<Icon icon={ threat.icon } className={ styles.threat__icon } />
				<div className={ styles.threat__summary }>
					<Text className={ styles.threat__summary__label } mb={ 1 }>
						{ threat.label }
					</Text>
					<Text className={ styles.threat__summary__title }>
						{ getFixerMessage( threat.fixable ) }
					</Text>
				</div>
				<div className={ styles.threat__severity }>
					<ThreatSeverityBadge severity={ threat.severity } />
				</div>

				{ fixAllDialog && (
					<div className={ styles.threat__checkbox }>
						<input
							type="checkbox"
							checked={ checkedFix }
							onChange={ checkFix }
							value={ threat.id }
						/>
					</div>
				) }
			</div>
		</>
	);
}
