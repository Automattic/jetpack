import { Button } from '@wordpress/components';

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
						{ variation.title }
					</span>
				</li>
			) ) }
		</ul>
	);
}
