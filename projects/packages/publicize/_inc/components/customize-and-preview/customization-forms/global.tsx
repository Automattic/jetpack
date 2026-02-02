import { hasSocialPaidFeatures } from '../../../utils';
import { SharePostForm } from '../../form/share-post-form';
import { UpgradeNoticeCustomization } from '../../form/upgrade-notice-customization';

/**
 * Global Customization Form component.
 *
 * @return - Global Customization Form component.
 */
export function GlobalCustomizationForm() {
	const hasPaidFeatures = hasSocialPaidFeatures();

	return (
		<SharePostForm
			analyticsData={ { location: 'preview-modal' } }
			isInsideNavigatorModal
			upgradeNotice={ ! hasPaidFeatures ? <UpgradeNoticeCustomization /> : undefined }
		/>
	);
}
