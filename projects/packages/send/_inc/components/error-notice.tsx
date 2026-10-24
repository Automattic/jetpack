import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

type ErrorNoticeProps = {
	message: string;
	/** What didn't work, above the message, e.g. "The log didn’t load". */
	title?: string;
	/** Shows Try again, which calls this. */
	onRetry?: () => void;
	/** Try again is running. */
	retrying?: boolean;
};

/**
 * An error notice: the message, with an optional title and Try again.
 *
 * @param props          - Component props.
 * @param props.message  - What went wrong.
 * @param props.title    - What didn't work.
 * @param props.onRetry  - Runs Try again.
 * @param props.retrying - Try again is running.
 * @return The notice.
 */
const ErrorNotice = ( { message, title, onRetry, retrying = false }: ErrorNoticeProps ) => (
	<Notice.Root intent="error">
		{ title && <Notice.Title>{ title }</Notice.Title> }
		<Notice.Description>{ message }</Notice.Description>
		{ onRetry && (
			<Notice.Actions>
				<Notice.ActionButton
					variant="outline"
					onClick={ onRetry }
					loading={ retrying }
					loadingAnnouncement={ __( 'Trying again', 'jetpack-send-pkg' ) }
				>
					{ __( 'Try again', 'jetpack-send-pkg' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		) }
	</Notice.Root>
);

export default ErrorNotice;
