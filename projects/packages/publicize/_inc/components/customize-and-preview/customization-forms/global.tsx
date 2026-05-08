import { useSelect } from '@wordpress/data';
import useSocialMediaMessage from '../../../hooks/use-social-media-message';
import { store as socialStore } from '../../../social-store';
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

	// Pre-fill the message field with the admin-page main template when the user
	// hasn't typed a per-post share message, so the editor reflects what the
	// rendered preview will use as a fallback (see `useRenderMessageItems`).
	// Empty `shareMessage` is preserved in post meta — the template only shows
	// as the displayed value, never as `updateMessage`'s input.
	const { message: shareMessage } = useSocialMediaMessage();
	const messageTemplate = useSelect(
		select => select( socialStore ).getSocialSettings().messageTemplate ?? '',
		[]
	);
	const message = shareMessage || messageTemplate;

	return (
		<SharePostForm
			analyticsData={ { location: 'preview-modal' } }
			isInsideNavigatorModal
			message={ message }
			upgradeNotice={ ! hasPaidFeatures ? <UpgradeNoticeCustomization /> : undefined }
		/>
	);
}
