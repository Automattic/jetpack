import { Badge, Icon, Link, Stack, Text } from '@wordpress/ui';
import type { ComponentProps, ReactElement } from 'react';

type Props = {
	icon: ReactElement;
	title: string;
	description: string;
	status: { label: string; intent: ComponentProps< typeof Badge >[ 'intent' ] };
	action?: { label: string; url: string; external?: boolean };
};

/**
 * One feature of the Protect dashboard: what it does, whether it is on, and where to manage it.
 *
 * @param props             - Component props.
 * @param props.icon        - The feature's icon.
 * @param props.title       - The feature's name.
 * @param props.description - What the feature does.
 * @param props.status      - The status badge.
 * @param props.action      - Optional link to manage the feature.
 * @return The section.
 */
export default function ProtectSection( { icon, title, description, status, action }: Props ) {
	return (
		<section className="jp-protect-dashboard__section" aria-label={ title }>
			<Stack direction="column" gap="md">
				<Stack direction="row" gap="sm" align="center" justify="space-between">
					<Stack direction="row" gap="sm" align="center">
						<Icon icon={ icon } size={ 24 } />
						<Text variant="heading-md">{ title }</Text>
					</Stack>
					<Badge intent={ status.intent }>{ status.label }</Badge>
				</Stack>
				<Text variant="body-md">{ description }</Text>
				{ action && (
					<Link href={ action.url } openInNewTab={ action.external }>
						{ action.label }
					</Link>
				) }
			</Stack>
		</section>
	);
}
