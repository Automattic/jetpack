import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Integration Panel component.
 *
 * @param {object}   props                - Component props.
 * @param {Function} props.setIsModalOpen - Function to set modal open or closed
 * @return {object} The IntegrationPanel component.
 */
export default function IntegrationPanel( { setIsModalOpen } ) {
	return (
		<div className="jetpack-forms-integration-panel">
			<Button
				variant="secondary"
				onClick={ () => setIsModalOpen( true ) }
				__next40pxDefaultSize={ true }
			>
				{ __( 'Manage integrations', 'jetpack-forms' ) }
			</Button>
		</div>
	);
}
