import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
import { useContext, useMemo } from 'react';
import { Threat, THREAT_ACTION_UNIGNORE, ThreatsContext } from '@automattic/jetpack-scan';

/**
 * Threat Modal Header Actions
 *
 * @param {object} props        - The component props.
 * @param {Threat} props.threat - The threat to display.
 *
 * @return {JSX.Element} The header actions.
 */
export default function ThreatDetailsModalActions( { threat }: { threat: Threat } ): JSX.Element {
	const { actions, setSelectedThreat, setActionToConfirm } = useContext( ThreatsContext );

	const controls = useMemo( () => {
		const result = [];

		if ( threat.status === 'current' ) {
			result.push( {
				id: 'ignore',
				icon: unseen,
				title: __( 'Ignore', 'jetpack-scan' ),
				onClick: () => {
					setActionToConfirm( { id: 'ignore', items: [ threat ] } );
				},
				variant: 'secondary',
			} );
		}

		if ( threat.status === 'ignored' ) {
			result.push( {
				id: 'unignore',
				icon: seen,
				title: __( 'Stop Ignoring', 'jetpack-scan' ),
				onClick: () => {
					actions?.[ THREAT_ACTION_UNIGNORE ]?.callback( [ threat ], {
						onActionPerformed: () => {
							setActionToConfirm( undefined );
							setSelectedThreat( null );
						},
					} );
				},
				variant: 'tertiary',
			} );
		}

		if ( threat.fixable ) {
			result.push( {
				id: 'fix',
				icon: seen,
				title: __( 'Show Auto-Fix', 'jetpack-scan' ),
				onClick: () => {
					setActionToConfirm( { id: 'fix', items: [ threat ] } );
				},
				variant: 'primary',
			} );
		}

		return result;
	}, [ threat, setActionToConfirm, actions, setSelectedThreat ] );

	return (
		<>
			{ controls.map( ( control, index ) => (
				<Button
					key={ index }
					onClick={ control.onClick }
					children={ control.title }
					variant={ control.variant }
				/>
			) ) }
		</>
	);
}
