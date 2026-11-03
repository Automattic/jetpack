import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { Fragment } from 'react';
import './style.scss';
import type { ElementType, ReactNode } from 'react';

export interface HelpFooterProps {
	/** Element/component used to wrap the message. Defaults to `@wordpress/ui` `Text`. */
	wrapper?: ElementType< { children?: ReactNode; className?: string } >;
	/** CSS namespace used to build the link class name (`<namespace>__link`). */
	namespace: string;
	/** Whether to render a trailing period after the message. */
	trailingPeriod?: boolean;
	/** Optional click handler for the "Jetpack connection" link. */
	onLearnClick?: VoidFunction;
	/** Optional click handler for the "contact Jetpack support" link. */
	onSupportClick?: VoidFunction;
}

/**
 * Shared "Need help?" footer message linking to connection docs and support.
 *
 * @param {HelpFooterProps} props - The component props.
 * @return {import('react').ReactNode} - The HelpFooter component.
 */
const HelpFooter = ( {
	wrapper = Text,
	namespace,
	trailingPeriod = false,
	onLearnClick,
	onSupportClick,
}: HelpFooterProps ) => {
	const Wrapper = wrapper;
	const linkClassName = `${ namespace }__link`;

	// The shared class carries the footer's own typography; the namespaced one
	// is a hook for a consumer that needs to depart from it.
	const messageClassName = clsx( 'jp-connection__help-footer', `${ namespace }__help-message` );

	return (
		<Wrapper className={ messageClassName }>
			{ createInterpolateElement(
				__(
					'<strong>Need help?</strong> Learn more about the <connectionInfoLink>Jetpack connection</connectionInfoLink> or <supportLink>contact Jetpack support</supportLink>',
					'jetpack-connection-js'
				),
				{
					strong: <strong></strong>,
					connectionInfoLink: (
						<Link
							openInNewTab
							href={ getRedirectUrl( 'why-the-wordpress-com-connection-is-important-for-jetpack' ) }
							className={ linkClassName }
							onClick={ onLearnClick }
						/>
					),
					supportLink: (
						<Link
							openInNewTab
							href={ getRedirectUrl( 'jetpack-support' ) }
							className={ linkClassName }
							onClick={ onSupportClick }
						/>
					),
				}
			) }
			{ trailingPeriod && <Fragment>.</Fragment> }
		</Wrapper>
	);
};

export default HelpFooter;
