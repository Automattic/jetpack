import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { Notice } from '@wordpress/ui';
import { Link } from 'react-router';
import type { FC } from 'react';

/**
 * Shown when Critical CSS generation finished but every page inlines its CSS,
 * so there is nothing to optimize. A benign, expected outcome - not an error.
 */
const InlinedCssNotice: FC = () => {
	return (
		<Notice.Root intent="info">
			<Notice.Title>{ __( 'Critical CSS is not needed', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				{ createInterpolateElement(
					__(
						'Your site already inlines its CSS, so Critical CSS is not needed here — there is nothing to optimize. <advanced>View advanced recommendations</advanced> for details.',
						'jetpack-boost'
					),
					{
						advanced: <Link to="/critical-css-advanced" />,
					}
				) }
			</Notice.Description>
		</Notice.Root>
	);
};

export default InlinedCssNotice;
