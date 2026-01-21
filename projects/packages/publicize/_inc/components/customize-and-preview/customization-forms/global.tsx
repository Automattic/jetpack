import { SharePostForm } from '../../form/share-post-form';

/**
 * Global Customization Form component.
 *
 * @return - Global Customization Form component.
 */
export function GlobalCustomizationForm() {
	return (
		<div>
			<SharePostForm analyticsData={ { location: 'preview-modal' } } isInsideNavigatorModal />
		</div>
	);
}
