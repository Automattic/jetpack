/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import styles from './widget-error-notice.module.scss';

type WidgetErrorNoticeProps = {
	/**
	 * Error config reported through WidgetRoot's setError channel:
	 * a message plus an optional action (e.g. Retry), or `true` for a
	 * default error with no details.
	 */
	error: { message?: string; action?: { label: string; onClick: () => void } } | true;
};

/*
 * Inline error state for widget data failures.
 *
 * The upstream widgets-toolkit reports errors to the CIAB dashboard chrome
 * through a `setError` render prop; the Premium Analytics widget contract
 * (`WidgetRenderProps`) has no such channel, so the widget renders the
 * reported error config itself.
 */
export function WidgetErrorNotice( { error }: WidgetErrorNoticeProps ) {
	const config = error === true ? {} : error;
	const message =
		config.message ||
		__( "We couldn't load this data. Please try again in a moment.", 'jetpack-premium-analytics' );

	return (
		<Stack direction="column" justify="center" align="center" gap="sm" className={ styles.notice }>
			<Text variant="body-sm">{ message }</Text>
			{ config.action && (
				<Button variant="secondary" size="sm" onClick={ config.action.onClick }>
					{ config.action.label }
				</Button>
			) }
		</Stack>
	);
}
