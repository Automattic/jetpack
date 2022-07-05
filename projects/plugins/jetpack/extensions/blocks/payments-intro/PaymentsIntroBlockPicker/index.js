import { Button } from '@wordpress/components';
import './style.scss';

export default function ( { variations, onSelect, label } ) {
	return (
		<ul aria-label={ label } className="wp-payments-intro-variation-picker">
			{ variations.map( variation => (
				<li key={ variation.name }>
					<Button
						variant="secondary"
						icon={ variation.icon }
						iconSize={ 48 }
						onClick={ () => onSelect( variation ) }
						className="wp-payments-intro-variation-picker__variation"
						label={ variation.description || variation.title }
					/>
					<span className="wp-payments-intro-variation-picker__variation-label" role="presentation">
						{ variation.title }
					</span>
				</li>
			) ) }
		</ul>
	);
}
