/**
 * External dependencies
 */
import { map, find } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

export default function LabelsDropdown ( {
	id,
	className,
	labels,
	value,
	slug,
	onSelect,
	onChange,
	position = { position: 'bottom' },
} ) {
	const labelBySlug = find( labels, ( label ) => label.slug === slug );
	const defaultLabelObject = slug && labelBySlug ? labelBySlug : labels[ 0 ];

	const isCustomLabel = ! slug && value;
	const currentValue = isCustomLabel ? value : defaultLabelObject.value;
	const currentSlug = ! isCustomLabel ? ( slug || defaultLabelObject.slug ) : null;

	return (
		<DropdownMenu
			popoverProps={ position }
			className={ `${ className }__label-container` }
			toggleProps={ {
				className: classNames(
					`${ className }__label`,
					{
						[ `is-${ currentSlug }-label` ]: !! currentSlug,
						[ 'is-custom-label' ]: isCustomLabel,
					}
				),
				children: <span>{ currentValue }</span>,
			} }
			icon={ null }
		>
			{ () => (
				<Fragment>
					<MenuGroup className={ `${ className }__labels-selector` }>
						{ map( labels, ( { value: newLabel, slug: newLabelSlug } ) => (
							<MenuItem
								key={ newLabelSlug }
								onClick={ () => onSelect( { newLabel, newLabelSlug } ) }
								isSelected={ true }
							>
								{ newLabel }
							</MenuItem>
						) ) }
					</MenuGroup>

					<BaseControl
						id={ id }
						className={ `${ className }__custom-label` }
						label={ __( 'Custom', 'jetpack' ) }
					>
						<div className={ `${ className }__text-button-container` }>
							<TextControl
								id={ id }
								value={ value }
								onChange={ ( newLabel ) => onChange( { newLabel, newLabelSlug: null } ) }
							/>
						</div>
					</BaseControl>
				</Fragment>
			) }
		</DropdownMenu>
	);
}
