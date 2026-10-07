import { Button, Icon, ToggleControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import type { FC, ReactElement, ReactNode } from 'react';

type BoxProps = {
	icon: ReactElement;
	title: string;
	badge?: ReactNode;
	description?: ReactNode;
	defaultOpen?: boolean;
	children?: ReactNode;
};

/**
 * A collapsible feature box: header, one-line description, then divided rows.
 *
 * @param props             - Component props.
 * @param props.icon        - Header icon.
 * @param props.title       - Feature name.
 * @param props.badge       - Short status next to the title, e.g. "On".
 * @param props.description - What the feature does.
 * @param props.defaultOpen - Whether the box starts expanded.
 * @param props.children    - Rows.
 * @return The box.
 */
export const SecurityBox: FC< BoxProps > = ( {
	icon,
	title,
	badge,
	description,
	defaultOpen = true,
	children,
} ) => {
	const [ open, setOpen ] = useState( defaultOpen );
	const toggleOpen = useCallback( () => setOpen( value => ! value ), [] );

	return (
		<section className="jp-protect-box">
			<header className="jp-protect-box__header">
				<Icon icon={ icon } className="jp-protect-box__icon" />
				<h2 className="jp-protect-box__title">{ title }</h2>
				{ badge && <span className="jp-protect-box__badge">{ badge }</span> }
				<Button
					className="jp-protect-box__toggle"
					icon={ open ? chevronUp : chevronDown }
					label={ open ? __( 'Collapse', 'jetpack' ) : __( 'Expand', 'jetpack' ) }
					aria-expanded={ open }
					onClick={ toggleOpen }
				/>
			</header>
			{ open && (
				<>
					{ description && <p className="jp-protect-box__description">{ description }</p> }
					{ children }
				</>
			) }
		</section>
	);
};

type RowProps = {
	children: ReactNode;
};

/**
 * A divided row inside a box.
 *
 * @param props          - Component props.
 * @param props.children - Row content.
 * @return The row.
 */
export const BoxRow: FC< RowProps > = ( { children } ) => (
	<div className="jp-protect-box__row">{ children }</div>
);

type ToggleRowProps = {
	label: string;
	help?: ReactNode;
	checked: boolean;
	disabled?: boolean;
	onChange: ( value: boolean ) => void;
	children?: ReactNode;
};

/**
 * A row holding one setting toggle, with optional extra content under it.
 *
 * @param props          - Component props.
 * @param props.label    - Setting name.
 * @param props.help     - Setting description.
 * @param props.checked  - Current value.
 * @param props.disabled - Whether the toggle is locked.
 * @param props.onChange - Called with the new value.
 * @param props.children - Content shown under the toggle.
 * @return The row.
 */
export const ToggleRow: FC< ToggleRowProps > = ( {
	label,
	help,
	checked,
	disabled,
	onChange,
	children,
} ) => (
	<BoxRow>
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			checked={ checked }
			disabled={ disabled }
			onChange={ onChange }
		/>
		{ children && <div className="jp-protect-box__row-extra">{ children }</div> }
	</BoxRow>
);

type Stat = {
	label: string;
	value: ReactNode;
	tone?: 'ok' | 'warning' | 'neutral';
};

/**
 * A grid of small stat tiles showing what a feature has done.
 *
 * @param props       - Component props.
 * @param props.stats - The tiles.
 * @return The grid.
 */
export const StatGrid: FC< { stats: Stat[] } > = ( { stats } ) => (
	<div className="jp-protect-box__stats">
		{ stats.map( stat => (
			<div key={ stat.label } className={ `jp-protect-box__stat is-${ stat.tone ?? 'neutral' }` }>
				<span className="jp-protect-box__stat-value">{ stat.value }</span>
				<span className="jp-protect-box__stat-label">{ stat.label }</span>
			</div>
		) ) }
	</div>
);
