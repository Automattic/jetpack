/**
 * External dependencies
 */
import { Notice } from '@jetpack-premium-analytics/externals';
import { FeedbackModal } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useFeedbackBanner } from '../../hooks/use-feedback-banner';
import styles from './feedback-banner.module.scss';

type FeedbackBannerProps = {
	/**
	 * Whether the surface the banner belongs to is ready; nothing shows until then.
	 */
	enabled: boolean;
};

/**
 * Stands above the widgets asking what the reader makes of the preview, and
 * hands them the same modal the page options menu does.
 *
 * @param {FeedbackBannerProps} props - Component props.
 * @return The banner, the modal it opens, or nothing.
 */
export function FeedbackBanner( { enabled }: FeedbackBannerProps ): JSX.Element {
	const { isVisible, isFeedbackOpen, open, complete, close, dismiss } = useFeedbackBanner( {
		enabled,
	} );

	const message = __(
		"Tell us what's better, what's worse, and what you miss about the new Traffic tab.",
		'jetpack-premium-analytics-pkg'
	);

	return (
		<>
			{ isVisible && (
				// The sentence alone: the default would trail the button and the
				// dismiss label after it, which is not what the notice has to say.
				<Notice.Root intent="info" spokenMessage={ message } className={ styles.banner }>
					<Notice.Description>{ message }</Notice.Description>

					<Notice.Actions>
						<Notice.ActionButton variant="outline" onClick={ open }>
							{ __( 'Leave feedback', 'jetpack-premium-analytics-pkg' ) }
						</Notice.ActionButton>
					</Notice.Actions>

					<Notice.CloseIcon
						label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
						onClick={ dismiss }
					/>
				</Notice.Root>
			) }

			{ isFeedbackOpen && (
				<FeedbackModal source="banner" onSubmit={ complete } onClose={ close } />
			) }
		</>
	);
}
