import {
	Button,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { STORE_ID } from '../../store';

const PricingPage = () => {
	const siteSuffix = useSelect( select => select( STORE_ID ).getSiteSuffix() );
	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;

	const hidePricingPage = useCallback( () => {
		const newOption = {
			show_pricing_page: false,
		};
		updateOptions( newOption );
	}, [ updateOptions ] );

	return (
		<PricingTable
			title={ __( 'Write once, post everywhere', 'jetpack-social' ) }
			items={ [
				{ name: __( 'Number of shares', 'jetpack-social' ) },
				{ name: __( 'Schedule posting', 'jetpack-social' ) },
				{ name: __( 'Priority support', 'jetpack-social' ) },
				{ name: __( 'Twitter, Facebook, LinkedIn & Tumblr', 'jetpack-social' ) },
				{ name: __( 'Customize publications', 'jetpack-social' ) },
			] }
		>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ 9.95 }
						offPrice={ 4.98 }
						leyend={ __( '/month', 'jetpack-social' ) }
						currency="USD"
					/>
					<Button
						href={ getRedirectUrl( 'jetpack-social-basic-plan-plugin-admin-page', {
							site: siteSuffix,
							query: 'redirect_to=' + window.location.href,
						} ) }
						fullWidth
					>
						{ __( 'Get Social', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded={ true }
					label={ <strong>{ __( 'Up to 1000', 'jetpack-social' ) }</strong> }
				/>
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice price={ 0 } leyend="" currency="USD" hidePriceFraction />
					<Button fullWidth variant="secondary" onClick={ hidePricingPage }>
						{ __( 'Start for free', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded={ true }
					label={ <strong>{ __( 'Up to 30', 'jetpack-social' ) }</strong> }
				/>
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
		</PricingTable>
	);
};

export default PricingPage;
