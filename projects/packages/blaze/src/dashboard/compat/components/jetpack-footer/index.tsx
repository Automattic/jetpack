// Ported from wp-calypso client/components/jetpack/jetpack-footer.
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import AutomatticBylineLogo from './automattic-byline-logo';
import type { FC } from 'react';

import './style.scss';

export interface JetpackFooterProps {
	className?: string;
	/** Product name shown at the start of the footer. */
	name: string;
}

/**
 * Footer with the product name and the Automattic byline.
 *
 * @param props           - Component props.
 * @param props.className - Extra class name.
 * @param props.name      - Product name.
 * @return The footer.
 */
const JetpackFooter: FC< JetpackFooterProps > = ( { className, name } ) => (
	<Stack
		render={ <footer /> }
		className={ clsx( 'jetpack-footer', className ) }
		aria-label={ name }
		role="contentinfo"
		direction="row"
		justify="flex-start"
		align="center"
		wrap="wrap"
		gap="xl"
	>
		<span className="jetpack-footer__logo-text">{ name }</span>
		<a
			className="jetpack-footer__a8c"
			href="https://jetpack.com/redirect/?source=a8c-about"
			rel="noopener noreferrer"
			target="_blank"
		>
			<AutomatticBylineLogo height={ 8 } />
		</a>
	</Stack>
);

export default JetpackFooter;
