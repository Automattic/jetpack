
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
import { useEffect } from '@wordpress/element';

const LOG_TEMPLATE = [
	[ 'core/paragraph', { placeholder: __( 'Start logging…', 'Jetpack' ) } ],
    ];

const LabelsDropdown = ( {
	className,
	labels,
	current,
	onSelect,
} ) => {
	const currentLabel = current ? current.label : labels?.[ 0 ]?.label;

	return (
		<Dropdown
			className={ className }
			contentClassName="my-popover-content-classname"
			position="left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button isPrimary onClick={ onToggle } aria-expanded={ isOpen }>
					{ currentLabel }
				</Button>
			) }
			renderContent={ () => {
				return (
					<NavigableMenu>
						<MenuGroup>
							{ map( labels, ( { slug, label } ) => (
								<MenuItem
									className={ classNames(
										'log-label',
										`${slug}-label`,
									) }
									key={ slug }
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
	attributes,
	setAttributes,
} ) {
	const { labels = [] } = attributes;

	useEffect( () => {
		if ( labels?.length ) {
			return;
		}

		setAttributes( {
			labels: [
				...labels,
				{
					slug: 'new-log',
					label: __( 'New log', 'jetpack' ),
					color: 'green',
				},
			],
		} );
	}, [ labels, setAttributes ] );

	return (
		<div class={ className }>
			<LabelsDropdown
				className={ `${ className }__labels-dropdown` }
				onSelect={ console.warn }
				labels={ labels }
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
