/**
 * External dependencies
 */
import { Button, Icon, Tooltip } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './utm-url-builder-button.module.scss';
import type { JSX } from 'react';

export type UtmUrlBuilderButtonProps = {
	/** The row's title, which names the button for assistive technology. */
	label: string;
	onClick: () => void;
};

/**
 * The "Build URL" action of a post row: an icon-only button that opens the UTM URL builder.
 *
 * @param props         - Component props.
 * @param props.label   - The row's title.
 * @param props.onClick - Called when the reader presses the button.
 * @return The button.
 */
export function UtmUrlBuilderButton( { label, onClick }: UtmUrlBuilderButtonProps ): JSX.Element {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Button
						className={ styles.button }
						variant="unstyled"
						type="button"
						onClick={ onClick }
						aria-label={ sprintf(
							/* translators: %s: the title of a post or page. */
							__( 'Build URL for "%s"', 'jetpack-premium-analytics-pkg' ),
							label
						) }
					>
						<Icon icon={ link } size={ 16 } />
					</Button>
				}
			/>
			<Tooltip.Popup>{ __( 'Build URL', 'jetpack-premium-analytics-pkg' ) }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
