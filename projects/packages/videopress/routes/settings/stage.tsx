import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useSettings, useUpdateSettings } from '../../src/dashboard/hooks/use-settings';
import './style.scss';

const SettingsForm = () => {
	const settings = useSettings();
	const update = useUpdateSettings();
	const privateForSite = settings.data?.videoPressVideosPrivateForSite ?? false;
	const autoSubtitlesDisabled = settings.data?.videoPressAutoSubtitlesDisabled ?? false;
	const disabled = settings.isLoading || update.isPending;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Video settings', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Only logged-in users can play your videos', 'jetpack-videopress-pkg' ) }
						help={ __(
							"Private videos won't play for signed-out visitors.",
							'jetpack-videopress-pkg'
						) }
						checked={ privateForSite }
						disabled={ disabled }
						onChange={ next => update.mutate( { videoPressVideosPrivateForSite: next } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Automatically generate subtitles for new videos',
							'jetpack-videopress-pkg'
						) }
						help={ __(
							'When enabled, subtitles are generated automatically for videos uploaded to this site. Existing subtitles are not affected.',
							'jetpack-videopress-pkg'
						) }
						checked={ ! autoSubtitlesDisabled }
						disabled={ disabled }
						onChange={ next => update.mutate( { videoPressAutoSubtitlesDisabled: ! next } ) }
					/>
				</Stack>
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
