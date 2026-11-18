import { safeHTML } from '@wordpress/dom';
import { Badge, Stack, Text } from '@wordpress/ui';
import type { ReactNode } from 'react';

/**
 * One row of a Payments list, such as a plan or a coupon.
 *
 * @param props                 - Component props.
 * @param props.title           - The item's name.
 * @param props.description     - Its description, as typed.
 * @param props.descriptionHtml - Its description rendered from Markdown, shown in place of the typed one when present.
 * @param props.price           - Its price.
 * @param props.badges          - Its badges.
 * @param props.children        - Its actions.
 * @return The row.
 */
export default function ListRow( {
	title,
	description = '',
	descriptionHtml = '',
	price = '',
	badges,
	children,
}: {
	title: string;
	description?: string;
	descriptionHtml?: string;
	price?: string;
	badges: string[];
	children?: ReactNode;
} ) {
	return (
		<Stack
			direction="row"
			gap="md"
			align="center"
			justify="space-between"
			className="jp-monetize-payments__row"
		>
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm" render={ <h3 /> }>
					{ title }
				</Text>
				{ descriptionHtml ? (
					<Text variant="body-sm" render={ <div /> }>
						<div
							className="jp-monetize-payments__description"
							// WordPress.com renders it with an allowlist of tags; safeHTML is a second pass.
							// eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={ { __html: safeHTML( descriptionHtml ) } }
						/>
					</Text>
				) : (
					description && <Text variant="body-sm">{ description }</Text>
				) }
				{ price && <Text variant="body-sm">{ price }</Text> }
				{ badges.length > 0 && (
					<Stack direction="row" gap="xs" wrap="wrap">
						{ badges.map( badge => (
							<Badge key={ badge } intent="informational">
								{ badge }
							</Badge>
						) ) }
					</Stack>
				) }
			</Stack>
			{ children }
		</Stack>
	);
}
