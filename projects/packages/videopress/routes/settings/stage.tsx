import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useSettings, useUpdateSettings } from '../../src/dashboard/hooks/use-settings';
import './style.scss';

const SettingsForm = () => {
	const settings = useSettings();
	const update = useUpdateSettings();
	const checked = settings.data?.videoPressVideosPrivateForSite ?? false;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Restrict video access', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Only logged-in users can play your videos', 'jetpack-videopress-pkg' ) }
					checked={ checked }
					disabled={ settings.isLoading || update.isPending }
					onChange={ next => update.mutate( { videoPressVideosPrivateForSite: next } ) }
				/>
			</Card.Content>
		</Card.Root>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<DashboardLayout activeTab="settings">
			<div className="jp-videopress-settings">
				<SettingsForm />
			</div>
		</DashboardLayout>
	</QueryClientWrapper>
);

export { Stage as stage };
