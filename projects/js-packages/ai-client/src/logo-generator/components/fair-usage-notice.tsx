import { Notice } from '@wordpress/components';
import useFairUsageNoticeMessage from '../hooks/use-fair-usage-notice-message.tsx';

type FairUsageNoticeProps = {
	variant?: 'error' | 'muted';
};

/**
 * The fair usage notice component.
 * @param {FairUsageNoticeProps}         props         - Fair usage notice component props.
 * @param {FairUsageNoticeProps.variant} props.variant - The variant of the notice to render.
 * @return the Notice component with the fair usage message.
 */
export const FairUsageNotice = ( { variant = 'error' }: FairUsageNoticeProps ) => {
	const useFairUsageNoticeMessageElement = useFairUsageNoticeMessage();

	if ( variant === 'muted' ) {
		return (
			<span className="jetpack-ai-fair-usage-notice-muted-variant">
				{ useFairUsageNoticeMessageElement }
			</span>
		);
	}

	if ( variant === 'error' ) {
		return (
			<Notice status="error" isDismissible={ false } className="jetpack-ai-fair-usage-notice">
				{ useFairUsageNoticeMessageElement }
			</Notice>
		);
	}

	return null;
};
