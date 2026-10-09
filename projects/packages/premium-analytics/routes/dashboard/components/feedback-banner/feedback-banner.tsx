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
import type { JSX } from 'react';

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
		"Tell us what's better, what's worse, and what you miss about the new Stats.",
		'jetpack-premium-analytics-pkg'
	);

	return (
		<>
			{ isVisible && (
				<Notice.Root intent="info" className={ styles.banner }>
					<Notice.Description>{ message }</Notice.Description>

					<Notice.Actions>
						<Notice.ActionButton variant="outline" onClick={ open }>
							{ __( 'Leave feedback', 'jetpack-premium-analytics-pkg' ) }
						</Notice.ActionButton>
					</Notice.Actions>

					<Notice.CloseIconButton
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
