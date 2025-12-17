import { getTitleFromDescription } from '../helpers';
import { LinkedInPostPreview } from './post-preview';
import { LinkedInPreviewProps } from './types';

type OptionalProps = Partial< Pick< LinkedInPreviewProps, 'name' | 'profileImage' > >;

export type LinkedInLinkPreviewProps = Omit< LinkedInPreviewProps, keyof OptionalProps > &
	OptionalProps;

/**
 * LinkedIn Link Preview Component
 * @param {LinkedInLinkPreviewProps} props - The props for the LinkedIn link preview.
 * @return The LinkedIn link preview component.
 */
export function LinkedInLinkPreview( props: LinkedInLinkPreviewProps ) {
	return (
		<LinkedInPostPreview
			name=""
			profileImage=""
			{ ...props }
			// Override the props that are irrelevant to link preview
			description=""
			media={ undefined }
			title={ props.title || getTitleFromDescription( props.description ) }
		/>
	);
}
