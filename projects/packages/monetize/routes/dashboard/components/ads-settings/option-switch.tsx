import { __ } from '@wordpress/i18n';
import { Link, SwitchControl } from '@wordpress/ui';
import { useCallback } from 'react';
import type { AdsOption } from '../../data/use-ads-settings';

// A group's help text and support page, which the Settings card showed in its info popover.
export type Help = { text: string; href: string };

interface OptionSwitchProps {
	name: AdsOption;
	label: string;
	checked: boolean;
	disabled: boolean;
	onChange: ( name: AdsOption, checked: boolean ) => void;
	help?: Help;
}

/**
 * A "Learn more" link to a support page.
 *
 * @param props      - Component props.
 * @param props.href - The support page.
 * @return The link.
 */
export function LearnMore( { href }: { href: string } ) {
	return (
		<Link href={ href } openInNewTab>
			{ __( 'Learn more', 'jetpack-monetize' ) }
		</Link>
	);
}

/**
 * The switch for one on/off Ads option.
 *
 * @param props          - Component props.
 * @param props.name     - The option name.
 * @param props.label    - The switch label.
 * @param props.checked  - The value to show.
 * @param props.disabled - Whether the option can't change now.
 * @param props.onChange - Saves the option.
 * @param props.help     - Help text and support page, if the group has them.
 * @return The switch.
 */
export function OptionSwitch( {
	name,
	label,
	checked,
	disabled,
	onChange,
	help,
}: OptionSwitchProps ) {
	const onCheckedChange = useCallback(
		( next: boolean ) => onChange( name, next ),
		[ name, onChange ]
	);

	return (
		<SwitchControl
			label={ label }
			description={ help?.text }
			details={ help && <LearnMore href={ help.href } /> }
			checked={ checked }
			disabled={ disabled }
			onCheckedChange={ onCheckedChange }
		/>
	);
}
