import { ToggleControl } from '@wordpress/components';
import { Card } from '@wordpress/ui';
import { useSetModuleState, type ModuleState } from '../lib/use-modules-state';
import type { ReactNode } from 'react';

type Props = {
	/** Module slug as it lives inside `modules_state` (e.g. `critical_css`). */
	slug: string;
	/** State entry for this module from `useModulesState()`. May be missing if the module is unavailable. */
	state: ModuleState | undefined;
	/** Whether the module's GET request is still in flight. */
	isLoading?: boolean;
	/** Primary label shown next to the toggle — the module's title. */
	label: ReactNode;
	/**
	 * Supporting copy rendered as a regular paragraph beneath the
	 * toggle row. Kept outside `ToggleControl`'s `help` slot so the
	 * description reads as full-weight body text rather than small
	 * muted helper copy.
	 */
	description?: ReactNode;
	/**
	 * Slot rendered whether the module is active or not — used for
	 * persistent affordances like upgrade Notices (e.g. the
	 * manual→auto Critical CSS upsell).
	 */
	persistent?: ReactNode;
	/** Sub-controls slot — rendered after the description when the module is active. */
	children?: ReactNode;
};

/**
 * Card primitive used to render a single Boost module in the Settings
 * tab. Each card is a `Card.Root` wrapping a stock `ToggleControl` from
 * `@wordpress/components` so the toggle and label follow the WPDS
 * canonical layout (toggle on the leading edge, label adjacent), with
 * the description rendered as a full-weight paragraph below.
 *
 * Modules with `available: false` are filtered out by the parent — the
 * card always assumes the module is available.
 *
 * @param props             - See `Props`.
 * @param props.slug
 * @param props.state
 * @param props.isLoading
 * @param props.label
 * @param props.description
 * @param props.persistent
 * @param props.children
 * @return The module card element.
 */
export default function ModuleCard( {
	slug,
	state,
	isLoading,
	label,
	description,
	persistent,
	children,
}: Props ): JSX.Element {
	const [ setModuleState, mutation ] = useSetModuleState();
	const isActive = state?.active ?? false;
	const isBusy = !! isLoading || mutation.isPending;

	const onChange = () => {
		setModuleState( slug, ! isActive );
	};

	return (
		<Card.Root>
			<Card.Content>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ label }
					checked={ isActive }
					disabled={ isBusy }
					onChange={ onChange }
				/>
				{ description && (
					<p className="jetpack-boost-settings__module-description">{ description }</p>
				) }
				{ persistent && (
					<div className="jetpack-boost-settings__module-persistent">{ persistent }</div>
				) }
				{ isActive && children && (
					<div className="jetpack-boost-settings__module-children">{ children }</div>
				) }
			</Card.Content>
		</Card.Root>
	);
}
