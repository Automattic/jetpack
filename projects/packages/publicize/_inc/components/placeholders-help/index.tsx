import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useMessageTemplatePlaceholders } from '../../hooks/use-message-template-placeholders';
import styles from './styles.module.scss';

type DropdownProps = React.ComponentProps< typeof Dropdown >;

/**
 * Toggle that reveals the list of placeholders supported in the custom message field.
 *
 * Sources its list from WPCOM via `@wordpress/core-data`, so the tokens and
 * labels never drift from the resolver. Renders nothing while the catalogue
 * is loading or if the fetch failed.
 *
 * @return Element rendered next to the textarea help text.
 */
export default function PlaceholdersHelp() {
	const { placeholders, isLoading } = useMessageTemplatePlaceholders();

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
					{ placeholders.map( ( { id, label } ) => (
						<li key={ id }>
							<code>{ id }</code>
							<span>{ label }</span>
						</li>
					) ) }
				</ul>
			</div>
		),
		[ placeholders ]
	);

	if ( isLoading || placeholders.length === 0 ) {
		return null;
	}

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
