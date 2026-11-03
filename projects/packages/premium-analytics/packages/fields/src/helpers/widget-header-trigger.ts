/**
 * External dependencies
 */
import { type DateControlTriggerProps } from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import styles from './widget-header-trigger.module.css';

// The host draws a widget's header fields compact.
export const WIDGET_HEADER_TRIGGER_PROPS: DateControlTriggerProps = {
	size: 'compact',
	className: styles.trigger,
};
