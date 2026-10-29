/**
 * External dependencies
 */
import { IconButton } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
/**
 * Internal dependencies
 */
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
		<IconButton
			icon={ link }
			label={ sprintf(
				/* translators: %s: the title of a post or page. */
				__( 'Build URL for "%s"', 'jetpack-premium-analytics-pkg' ),
				label
			) }
			size="small"
			variant="minimal"
			type="button"
			onClick={ onClick }
		/>
	);
}
