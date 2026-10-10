import type {
	ConnectionErrorGroup,
	ConnectionErrorNoticeLink,
} from '../../hooks/use-connection-error-notice/types.ts';
import type { Text } from '@wordpress/ui';
import type { ComponentProps, ReactElement } from 'react';

export interface ConnectionErrorDetailsProps {
	/** Fallback copy for callers with no derived groups. */
	message?: string | ReactElement;
	/** The derived error groups, as returned by `useConnectionErrorNotice`. */
	errorGroups?: ConnectionErrorGroup[];
	/** Whether to append the "Contact Jetpack Support" link. */
	showSupportLink?: boolean;
	/** Type scale for the headlines and the support link. Defaults to `Text`'s own default. */
	variant?: ComponentProps< typeof Text >[ 'variant' ];
	/** Fired when a notice-body link (e.g. "Visit Site Health") is clicked. */
	onNoticeLinkClick?: ( link: ConnectionErrorNoticeLink ) => void;
	/** Fired when the "Contact Jetpack Support" link is clicked. */
	onSupportLinkClick?: () => void;
}
