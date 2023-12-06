import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	PanelRow,
	SelectControl,
	TextControl,
	ExternalLink,
	Placeholder,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { useEffect } from 'react';
import { store as membershipProductsStore } from '../../../store/membership-products';
import { CURRENCY_OPTIONS } from '../../currencies';
import { API_STATE_NOT_REQUESTING, API_STATE_REQUESTING } from './constants';
import { useProductManagementContext } from './context';
import { getMessageByProductType, getTitleByProps } from './utils';

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_PRICE = 5;
const DEFAULT_INTERVAL = '1 month';
const DEFAULT_IS_CUSTOM_AMOUNT = false;

export default function ProductManagementInspectorControl() {
	const { productType, setSelectedProductIds } = useProductManagementContext();

	const siteSlug = useSelect( select => select( membershipProductsStore ).getSiteSlug() );

	const { saveProduct } = useDispatch( membershipProductsStore );

	const [ apiState, setApiState ] = useState( API_STATE_NOT_REQUESTING );
	const [ title, setTitle ] = useState(
		getMessageByProductType( 'default new product title', productType )
	);
	const [ isCustomTitle, setIsCustomTitle ] = useState( false );
	const [ currency, setCurrency ] = useState( DEFAULT_CURRENCY );
	const [ price, setPrice ] = useState( DEFAULT_PRICE );
	const [ interval, setInterval ] = useState( DEFAULT_INTERVAL );
	const [ isCustomAmount, setIsCustomAmount ] = useState( DEFAULT_IS_CUSTOM_AMOUNT );

	const intervalOptions = [
		{ label: __( 'Month', 'jetpack' ), value: '1 month' },
		{ label: __( 'Year', 'jetpack' ), value: '1 year' },
		{ label: __( 'One-Time Payment', 'jetpack' ), value: 'one-time' },
	];

	const handleSubmit = event => {
		event.preventDefault();
		setApiState( API_STATE_REQUESTING );
		saveProduct(
			{
				title,
				currency,
				price,
				interval,
				type: null,
				buyer_can_change_amount: isCustomAmount,
				is_editable: true,
			},
			productType,
			setSelectedProductIds,
			success => {
				setApiState( API_STATE_NOT_REQUESTING );
				if ( success ) {
					setPrice( DEFAULT_PRICE );
					setIsCustomTitle( false );
					setInterval( DEFAULT_INTERVAL );
					setIsCustomAmount( DEFAULT_IS_CUSTOM_AMOUNT );
					setCurrency( DEFAULT_CURRENCY );
				}
			}
		);
	};

	useEffect( () => {
		// If the user has manually selected a title then that should be left as-is, don't overwrite it
		if ( isCustomTitle ) {
			return;
		}
		setTitle( getTitleByProps( interval ) );
		setIsCustomTitle( false );
	}, [ interval, isCustomTitle ] );

	return (
		<InspectorControls>
			{ siteSlug && (
				<PanelBody>
					<ExternalLink href={ `https://wordpress.com/earn/payments/${ siteSlug }` }>
						{ getMessageByProductType( 'manage your products', productType ) }
					</ExternalLink>
				</PanelBody>
			) }
			<PanelBody
				title={ getMessageByProductType( 'add a new product', productType ) }
				initialOpen={ true }
				className={ 'product-management-control-inspector__add-plan' }
			>
				{ apiState === API_STATE_REQUESTING && (
					<Placeholder
						icon={ lock }
						label={ getMessageByProductType( 'saving product', productType ) }
					>
						<Spinner />
					</Placeholder>
				) }
				{ apiState === API_STATE_NOT_REQUESTING && (
					<>
						<PanelRow className="product-management-control-inspector__product-title">
							<TextControl
								id="new-product-title"
								label={ __( 'Name', 'jetpack' ) }
								onChange={ value => {
									setTitle( value );
									setIsCustomTitle( true );
								} }
								value={ title }
							/>
						</PanelRow>
						<PanelRow className="product-management-control-inspector__product-price">
							<SelectControl
								label={ __( 'Currency', 'jetpack' ) }
								onChange={ value => setCurrency( value ) }
								options={ CURRENCY_OPTIONS }
								value={ currency }
							/>
							<TextControl
								label={ __( 'Price', 'jetpack' ) }
								onChange={ value => setPrice( value ) }
								type="number"
								value={ price }
							/>
						</PanelRow>
						<PanelRow className="plan-interval">
							<SelectControl
								label={ __( 'Interval', 'jetpack' ) }
								onChange={ value => setInterval( value ) }
								options={ intervalOptions }
								value={ interval }
							/>
						</PanelRow>
						<PanelRow className="custom-amount">
							<ToggleControl
								label={ __( 'Enable customers to pick their own amount', 'jetpack' ) }
								onChange={ value => setIsCustomAmount( value ) }
								checked={ isCustomAmount }
							/>
						</PanelRow>
						<PanelRow>
							<ExternalLink href="https://wordpress.com/support/wordpress-editor/blocks/payments/#related-fees">
								{ __( 'Read more about Payments and related fees.', 'jetpack' ) }
							</ExternalLink>
						</PanelRow>
						<PanelRow>
							<Button onClick={ handleSubmit } variant="secondary">
								{ getMessageByProductType( 'add product', productType ) }
							</Button>
						</PanelRow>
					</>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
