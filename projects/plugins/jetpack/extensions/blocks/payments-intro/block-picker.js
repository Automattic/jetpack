import { Button } from '@wordpress/components';

const getBlockType = 'undefined' !== typeof window ? window.wp?.blocks?.getBlockType : null;

export default function PaymentsIntroBlockPicker( { variations, onSelect, label } ) {
	return (
		<ul aria-label={ label } className="wp-block-jetpack-payments-intro__variation-picker">
			{ variations.map( variation => (
				<li key={ variation.name }>
					<Button
						variant="secondary"
						icon={ variation.icon }
						iconSize={ 48 }
						onClick={ () => onSelect( variation ) }
						className="wp-block-jetpack-payments-intro__variation-picker__variation"
						label={ variation.description || variation.title }
					/>
					<span
						className="wp-block-jetpack-payments-intro__variation-picker__variation-label"
						role="presentation"
					>
						{
							// `displayTitle` takes precedence for variation entries that have their own
							// title (e.g. Tips). For standard block entries, fall back to the localized
							// title from the block registry; raw block.json titles are not translated.
							// See https://github.com/Automattic/jetpack/issues/37014
							variation.displayTitle || getBlockType?.( variation.name )?.title || variation.title
						}
					</span>
				</li>
			) ) }
		</ul>
	);
}
