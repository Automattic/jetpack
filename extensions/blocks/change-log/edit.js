
/**
 * External dependencies
 */
import classNames from 'classnames';
import { map } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { InnerBlocks } from '@wordpress/block-editor';
import { Dropdown, Button, NavigableMenu, MenuItem, MenuGroup } from '@wordpress/components';

const LOG_TEMPLATE = [
	[ 'core/paragraph', { placeholder: __( 'Start logging…', 'Jetpack' ) } ],
    ];

const LabelsDropdown = ( {
	className,
	labels = [
		__( 'New', 'jetpack' ),
		__( 'Incident', 'jetpack' )
	],
	current,
	onSelect,
} ) => {
	const defaultOption = labels?.length ? labels[ 0 ] : __( 'New', 'jetpack' );

	return (
		<Dropdown
			className={ className }
			contentClassName="my-popover-content-classname"
			position="left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button isPrimary onClick={ onToggle } aria-expanded={ isOpen }>
					{ defaultOption }
				</Button>
			) }
			renderContent={ () => {
				return (
					<NavigableMenu>
						<MenuGroup>
							{ map( labels, label => (
								<MenuItem
									className={ classNames(
										'log-label',
									) }
									key={ `${ label }-key`}
									isSelected={ current === label }
									onClick={ onSelect }
								>
									{ label }
								</MenuItem>
							) ) }
						</MenuGroup>
					</NavigableMenu>
				);
			} }
		/>
	);
};

export default function ChaneglogEdit ( {
	className,
} ) {
	return (
		<div class={ className }>
			<LabelsDropdown
				className={ `${ className }__labels-dropdown` }
				onSelect={ console.warn }
			/>
			<InnerBlocks
				template={ LOG_TEMPLATE }
				allowedBlocks={ [ 'core/paragraph' ] }
				templateLock="all"
				orientation="horizontal"
			/>
		</div>
	);
}
