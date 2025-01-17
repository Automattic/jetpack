import { THREAT_ACTION_UNIGNORE, ThreatsContext } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
import { useContext, useMemo } from 'react';
import { Button } from '@automattic/jetpack-components';

/**
 * Threat Modal Header Actions
 *
 * @return {JSX.Element} The header actions.
 */
export default function ThreatDetailsModalActions(): JSX.Element {
	const {
		actionCallbacks,
		selectedThreat: threat,
		setSelectedThreat,
		setActionToConfirm,
	} = useContext( ThreatsContext );

	const controls = useMemo( () => {
		const result = [];

		if ( threat.status === 'current' ) {
			result.push( {
				id: 'ignore',
				icon: unseen,
				title: __( 'Ignore', 'jetpack-components' ),
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
				title: __( 'Stop Ignoring', 'jetpack-components' ),
				onClick: () => {
					actionCallbacks?.[ THREAT_ACTION_UNIGNORE ]?.( [ threat ], {
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
				title: __( 'Auto-Fix', 'jetpack-components' ),
				onClick: () => {
					setActionToConfirm( { id: 'fix', items: [ threat ] } );
				},
				variant: 'primary',
			} );
		}

		return result;
	}, [ threat, setActionToConfirm, actionCallbacks, setSelectedThreat ] );

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
