import { Card, CardBody, CardHeader, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import DashboardLayout from '../../src/dashboard/components/DashboardLayout';

const Stage = () => {
	// Local-only state for Phase 1; wires to videopress/v1/settings in Phase 6.
	const [ restrict, setRestrict ] = useState( false );

	return (
		<DashboardLayout activeTab="settings">
			<Card>
				<CardHeader>{ __( 'Restrict video access', 'jetpack-videopress-pkg' ) }</CardHeader>
				<CardBody>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Only logged-in users can play your videos', 'jetpack-videopress-pkg' ) }
						checked={ restrict }
						onChange={ setRestrict }
					/>
				</CardBody>
			</Card>
		</DashboardLayout>
	);
};

export { Stage as stage };
