import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { getSocialScriptData } from '../../utils/script-data';
import styles from './styles.module.scss';

type DropdownProps = React.ComponentProps< typeof Dropdown >;

/**
 * Toggle that reveals the list of placeholders supported in the custom message field.
 *
 * Reads the catalogue from the social script-data payload that PHP renders
 * into the page, so the tokens and labels stay in lock-step with WPCOM's
 * resolver without a round-trip on editor mount.
 *
 * @return Element rendered next to the textarea help text, or null when the
 * catalogue is empty.
 */
export default function PlaceholdersHelp() {
	const placeholders = getSocialScriptData()?.message_templates?.placeholders;

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
					{ placeholders?.map( ( { id, label } ) => (
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

	if ( ! placeholders?.length ) {
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
