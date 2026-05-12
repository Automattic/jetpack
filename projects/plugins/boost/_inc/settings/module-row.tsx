import { ToggleControl } from '@wordpress/components';
import { useSetModuleState, type ModuleState } from '../lib/use-modules-state';
import type { ReactNode } from 'react';

type Props = {
	/** Module slug as it lives inside `modules_state` (e.g. `critical_css`). */
	slug: string;
	/** State entry for this module from `useModulesState()`. May be missing if the module is unavailable. */
	state: ModuleState | undefined;
	/** Whether the module's GET request is still in flight. */
	isLoading?: boolean;
	/** Primary label shown next to the toggle. */
	label: ReactNode;
	/** Regular body-text description rendered beneath the toggle row. */
	description?: ReactNode;
	/**
	 * Slot rendered whether the toggle is on or off — used for the
	 * "summary | action" subrow that should stay visible regardless
	 * of toggle state (e.g. the Cornerstone Pages "Edit pages" row),
	 * and for persistent upgrade Notices.
	 */
	persistent?: ReactNode;
	/** Slot rendered only when the toggle is on — sub-features that only make sense while the module is active. */
	children?: ReactNode;
};

/**
 * One row inside a `SectionCard`. Renders a `ToggleControl` (toggle +
 * label on the same row), a regular body paragraph for the
 * description, and two slot patterns:
 *
 * - `persistent` — always renders; used for "summary | action"
 *   subrows that need to stay reachable when the module is off.
 * - `children` — renders only while the toggle is on; used for
 *   sub-features that depend on the module being active (e.g. the
 *   Critical CSS Status panel, the Page Cache "Show options"
 *   collapsible).
 *
 * Unlike the previous `ModuleCard`, this row does not wrap itself
 * in `Card.Root` — the parent `SectionCard` owns the card surface.
 *
 * @param props             - See `Props`.
 * @param props.slug
 * @param props.state
 * @param props.isLoading
 * @param props.label
 * @param props.description
 * @param props.persistent
 * @param props.children
 * @return The module row element.
 */
export default function ModuleRow( {
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
		<div className="jetpack-boost-module-row">
			<ToggleControl
				__nextHasNoMarginBottom
				label={ label }
				checked={ isActive }
				disabled={ isBusy }
				onChange={ onChange }
			/>
			{ description && <p className="jetpack-boost-module-row__description">{ description }</p> }
			{ persistent && <div className="jetpack-boost-module-row__persistent">{ persistent }</div> }
			{ isActive && children && (
				<div className="jetpack-boost-module-row__children">{ children }</div>
			) }
		</div>
	);
}
