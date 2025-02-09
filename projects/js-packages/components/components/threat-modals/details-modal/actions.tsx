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
		actions,
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
				title: __( 'Show Auto-Fix', 'jetpack-components' ),
				onClick: () => {
					setActionToConfirm( { id: 'fix', items: [ threat ] } );
				},
				variant: 'primary',
			} );
		}

		if ( ! result.length ) {
			result.push( {
				id: 'confirm',
				title: __( 'Close', 'jetpack-components' ),
				onClick: () => {
					setActionToConfirm( undefined );
					setSelectedThreat( null );
				},
				variant: 'secondary',
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
