import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { useState } from 'react';
import DashboardLayout from '../../src/dashboard/components/DashboardLayout';
import './style.scss';

const Stage = () => {
	// Local-only state for Phase 1; wires to videopress/v1/settings in Phase 6.
	const [ restrict, setRestrict ] = useState( false );

	return (
		<DashboardLayout activeTab="settings">
			<div className="jp-videopress-settings">
				<Card.Root>
					<Card.Header>
						<Card.Title>{ __( 'Restrict video access', 'jetpack-videopress-pkg' ) }</Card.Title>
					</Card.Header>
					<Card.Content>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Only logged-in users can play your videos', 'jetpack-videopress-pkg' ) }
							checked={ restrict }
							onChange={ setRestrict }
						/>
					</Card.Content>
				</Card.Root>
			</div>
		</DashboardLayout>
	);
};

export { Stage as stage };
