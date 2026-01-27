import { hasSocialPaidFeatures } from '../../../utils';
import { SharePostForm } from '../../form/share-post-form';
import { UpgradeNoticeCustomisation } from '../../form/upgrade-notice-customisation';

/**
 * Global Customization Form component.
 *
 * @return - Global Customization Form component.
 */
export function GlobalCustomizationForm() {
	const hasPaidFeatures = hasSocialPaidFeatures();

	return (
		<div>
			<SharePostForm
				analyticsData={ { location: 'preview-modal' } }
				isInsideNavigatorModal
				upgradeNotice={ ! hasPaidFeatures ? <UpgradeNoticeCustomisation /> : undefined }
			/>
		</div>
	);
}
