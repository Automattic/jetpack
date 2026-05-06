import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import styles from './styles.module.scss';

type DropdownProps = React.ComponentProps< typeof Dropdown >;

type Placeholder = {
	token: string;
	description: string;
};

// TODO: SOCIAL-471 — replace this hardcoded list with a fetch from WPCOM.
const getPlaceholders = (): Placeholder[] => [
	{ token: '{title}', description: __( 'Post title', 'jetpack-publicize-pkg' ) },
	{ token: '{excerpt}', description: __( 'Post excerpt', 'jetpack-publicize-pkg' ) },
	{ token: '{content}', description: __( 'Full post content', 'jetpack-publicize-pkg' ) },
	{ token: '{url}', description: __( 'Permalink to the post', 'jetpack-publicize-pkg' ) },
	{ token: '{short_url}', description: __( 'Short URL of the post', 'jetpack-publicize-pkg' ) },
	{ token: '{tags}', description: __( 'Post tags as hashtags', 'jetpack-publicize-pkg' ) },
	{ token: '{categories}', description: __( 'Post categories', 'jetpack-publicize-pkg' ) },
	{ token: '{author}', description: __( 'Author display name', 'jetpack-publicize-pkg' ) },
	{ token: '{date}', description: __( 'Publication date', 'jetpack-publicize-pkg' ) },
	{ token: '{site_name}', description: __( 'Site title', 'jetpack-publicize-pkg' ) },
	{ token: '{site_url}', description: __( 'Site URL', 'jetpack-publicize-pkg' ) },
	{ token: '{meta:<key>}', description: __( 'Custom field value', 'jetpack-publicize-pkg' ) },
];

/**
 * Toggle that reveals the list of placeholders supported in the custom message field.
 *
 * @return Element rendered next to the textarea help text.
 */
export default function PlaceholdersHelp() {
	const placeholders = useMemo( getPlaceholders, [] );

	const renderToggle = useCallback< DropdownProps[ 'renderToggle' ] >(
		( { onToggle, isOpen } ) => (
			<Button variant="link" onClick={ onToggle } aria-expanded={ isOpen }>
				{ __( 'Available placeholders', 'jetpack-publicize-pkg' ) }
			</Button>
		),
		[]
	);

	const renderContent = useCallback(
		() => (
			<div className={ styles[ 'placeholders-help-content' ] }>
				<p>
					{ __(
						'Use placeholders to automatically insert post details.',
						'jetpack-publicize-pkg'
					) }
				</p>
				<ul>
					{ placeholders.map( ( { token, description } ) => (
						<li key={ token }>
							<code>{ token }</code>
							<span>{ description }</span>
						</li>
					) ) }
				</ul>
			</div>
		),
		[ placeholders ]
	);

	return (
		<Dropdown
			focusOnMount
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ renderToggle }
			renderContent={ renderContent }
			className={ styles[ 'placeholders-help' ] }
			contentClassName={ styles[ 'placeholders-help-popover' ] }
		/>
	);
}
