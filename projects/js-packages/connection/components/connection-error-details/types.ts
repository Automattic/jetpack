import type { ConnectionErrorGroup } from '../../hooks/use-connection-error-notice/types';
import type { Text } from '@wordpress/ui';
import type { ComponentProps, ReactElement } from 'react';

export interface ConnectionErrorDetailsProps {
	/** Fallback copy for callers with no derived groups. */
	message?: string | ReactElement;
	/** The derived error groups, as returned by `useConnectionErrorNotice`. */
	errorGroups?: ConnectionErrorGroup[];
	/** Whether to append the "Contact Jetpack Support" link. */
	showSupportLink?: boolean;
	/**
	 * Type scale for the headlines and the support link, so a surface with smaller
	 * body copy than a notice does not read as a notice dropped into it. Defaults
	 * to `Text`'s own default. The scope lines under a headline stay `body-sm`
	 * either way, being the smallest step the body scale has.
	 */
	variant?: ComponentProps< typeof Text >[ 'variant' ];
}
