/**
 * WordPress dependencies
 */

import {
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';

/**
 * Custom header component for Forms dashboard with consistent styling.
 *
 * @param {object}          props          - Component props.
 * @param {React.ReactNode} props.title    - The header title content.
 * @param {React.ReactNode} props.subTitle - The header subtitle/description.
 * @param {React.ReactNode} props.actions  - Action buttons to display in the header.
 * @return {JSX.Element} The header component.
 */
export default function Header( {
	title,
	subTitle,
	actions,
}: {
	title?: React.ReactNode;
	subTitle: React.ReactNode;
	actions?: React.ReactNode;
} ) {
	return (
		<VStack className="admin-ui-page__header" as="header" spacing={ 0 }>
			<HStack className="admin-ui-page__header-title" justify="space-between" spacing={ 2 }>
				<HStack spacing={ 2 }>
					{ title && (
						<Heading level={ 1 } size="15px" lineHeight="32px" truncate>
							{ title }
						</Heading>
					) }
				</HStack>
				<HStack
					style={ { width: 'auto', flexShrink: 0 } }
					spacing={ 2 }
					className="admin-ui-page__header-actions"
				>
					{ actions }
				</HStack>
			</HStack>
			{ subTitle && <p className="admin-ui-page__header-subtitle">{ subTitle }</p> }
		</VStack>
	);
}
