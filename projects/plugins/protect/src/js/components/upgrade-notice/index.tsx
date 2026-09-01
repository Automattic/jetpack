import { Notice } from '@wordpress/ui';
import type { FC, MouseEventHandler, ReactNode } from 'react';

interface UpgradeNoticeProps {
	/**
	 * The body copy describing the upgrade context.
	 */
	description: ReactNode;
	/**
	 * The CTA label for the action.
	 */
	cta: ReactNode;
	/**
	 * Click handler for the CTA. Used when `href` is not set — renders an ActionButton.
	 */
	onClick?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * Optional href. When set, renders an ActionLink instead of an ActionButton.
	 */
	href?: string;
	/**
	 * Whether to open the link in a new tab. Only applies when `href` is set.
	 */
	openInNewTab?: boolean;
	/**
	 * Forwarded to the underlying Notice.Root for layout overrides.
	 */
	className?: string;
}

/**
 * Package-local upgrade-notice helper, built on `@wordpress/ui` `Notice`.
 *
 * Wraps the `Notice.Root` + `Notice.Description` + `Notice.Actions` composition so the
 * three Protect upgrade-trigger sites stay terse. Replaces the deprecated
 * `ContextualUpgradeTrigger` from `@automattic/jetpack-components`.
 *
 * @param props              - Component properties.
 * @param props.description  - Body copy describing the upgrade context.
 * @param props.cta          - CTA label for the action.
 * @param props.onClick      - Click handler for the CTA (used when `href` is unset).
 * @param props.href         - Optional href. When set, renders an ActionLink.
 * @param props.openInNewTab - Whether to open the link in a new tab. Only applies when `href` is set.
 * @param props.className    - Optional class forwarded to the underlying Notice.Root.
 * @return The rendered upgrade notice.
 */
const UpgradeNotice: FC< UpgradeNoticeProps > = ( {
	description,
	cta,
	onClick,
	href,
	openInNewTab = false,
	className,
} ) => {
	return (
		<Notice.Root intent="info" className={ className }>
			<Notice.Description>{ description }</Notice.Description>
			<Notice.Actions>
				{ href !== undefined ? (
					<Notice.ActionLink href={ href } openInNewTab={ openInNewTab }>
						{ cta }
					</Notice.ActionLink>
				) : (
					<Notice.ActionButton onClick={ onClick }>{ cta }</Notice.ActionButton>
				) }
			</Notice.Actions>
		</Notice.Root>
	);
};

export default UpgradeNotice;
