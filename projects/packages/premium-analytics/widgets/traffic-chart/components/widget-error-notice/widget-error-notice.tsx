/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import styles from './widget-error-notice.module.scss';

type WidgetErrorNoticeProps = {
	/**
	 * Clears the error state and refetches the data.
	 */
	onRetry?: () => void;
};

/*
 * Inline error state for widget data failures.
 *
 * The upstream widgets-toolkit reports errors to the CIAB dashboard chrome
 * through a `setError` render prop; the Premium Analytics widget contract
 * (`WidgetRenderProps`) has no such channel, so the widget renders its own
 * error UI instead.
 */
export function WidgetErrorNotice( { onRetry }: WidgetErrorNoticeProps ) {
	return (
		<Stack direction="column" justify="center" align="center" gap="sm" className={ styles.notice }>
			<Text variant="body-sm">
				{ __(
					"We couldn't load this data. Please try again in a moment.",
					'jetpack-premium-analytics'
				) }
			</Text>
			{ onRetry && (
				<Button variant="secondary" size="sm" onClick={ onRetry }>
					{ __( 'Retry', 'jetpack-premium-analytics' ) }
				</Button>
			) }
		</Stack>
	);
}
