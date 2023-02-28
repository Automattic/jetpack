import {
	Button,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	getRedirectUrl,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const UNLIMITED = __( 'Unlimited', 'jetpack-social' );
const UNLIMITED_SHARES = __( 'Unlimited shares', 'jetpack-social' );
const UP_TO_30 = __( 'Up to 30', 'jetpack-social' );
const UP_TO_30_SHARES = __( 'Up to 30 shares in 30 days', 'jetpack-social' );

const PricingPage = () => {
	const siteSuffix = useSelect( select => select( STORE_ID ).getSiteSuffix() );
	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;

	const [ isLarge ] = useBreakpointMatch( 'lg' );

	const hidePricingPage = useCallback( () => {
		const newOption = {
			show_pricing_page: false,
		};
		updateOptions( newOption );
	}, [ updateOptions ] );

	// todo: pull pricing from wpcom
	const firstMonthIntroOffer = 1;
	const monthlyBasicPrice = 10;
	const monthlyAdvancedPrice = 15;

	const UNLIMITED_SHARES_TABLE_ITEM = (
		<PricingTableItem
			isIncluded
			label={
				<>
					<del>{ __( 'Up to 1,000', 'jetpack-social' ) }</del>&nbsp;
					<strong>{ isLarge ? UNLIMITED : UNLIMITED_SHARES }</strong>
				</>
			}
			tooltipTitle={ UNLIMITED_SHARES }
			tooltipInfo={ __(
				'We are working on exciting new features for Jetpack Social. In the meantime, enjoy unlimited shares for a limited time!',
				'jetpack-social'
			) }
		/>
	);

	return (
		<PricingTable
			showIntroOfferDisclaimer
			title={ __( 'Write once, post everywhere', 'jetpack-social' ) }
			items={ [
				{ name: __( 'Number of shares in 30 days', 'jetpack-social' ) },
				{ name: __( 'Priority support', 'jetpack-social' ) },
				{ name: __( 'Schedule posting', 'jetpack-social' ) },
				{ name: __( 'Twitter, Facebook, LinkedIn & Tumblr', 'jetpack-social' ) },
				{ name: __( 'Customize publications', 'jetpack-social' ) },
				{
					name: __( 'Recycle content', 'jetpack-social' ),
					tooltipInfo: __(
						'Repurpose, reuse or republish already published content.',
						'jetpack-social'
					),
				},
				{
					name: __( 'Engagement optimizer', 'jetpack-social' ),
					tooltipInfo: __(
						'Enhance social media engagement with personalized posts.',
						'jetpack-social'
					),
				},
				{
					name: __( 'Video sharing', 'jetpack-social' ),
					tooltipTitle: __( 'Coming soon', 'jetpack-social' ),
					tooltipInfo: __( 'Upload and share videos to your social platforms.', 'jetpack-social' ),
				},
				{
					name: __( 'Multi-image sharing', 'jetpack-social' ),
					tooltipTitle: __( 'Coming soon', 'jetpack-social' ),
					tooltipInfo: __(
						'Share multiple images at once on social media platforms.',
						'jetpack-social'
					),
				},
				{
					name: __( 'Image generator', 'jetpack-social' ),
					tooltipTitle: __( 'Coming soon', 'jetpack-social' ),
					tooltipInfo: __(
						'Automatically create custom images, saving you hours of tedious work.',
						'jetpack-social'
					),
				},
			] }
		>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ monthlyAdvancedPrice }
						offPrice={ firstMonthIntroOffer }
						legend={ sprintf(
							// translators: %s is the regular monthly price
							__( 'trial for the first month, then $%s /month, billed yearly', 'jetpack-social' ),
							monthlyAdvancedPrice
						) }
						currency="USD"
						hidePriceFraction
					/>
					<Button
						href={ getRedirectUrl( 'jetpack-social-advanced-plan-plugin-admin-page', {
							site: siteSuffix,
							query: 'redirect_to=' + window.location.href,
						} ) }
						fullWidth
					>
						{ __( 'Get Advanced plan', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
				{ UNLIMITED_SHARES_TABLE_ITEM }
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isComingSoon />
				<PricingTableItem isComingSoon />
				<PricingTableItem isComingSoon />
			</PricingTableColumn>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ monthlyBasicPrice }
						offPrice={ firstMonthIntroOffer }
						legend={ sprintf(
							// translators: %s is the regular monthly price
							__( 'trial for the first month, then $%s /month, billed yearly', 'jetpack-social' ),
							monthlyBasicPrice
						) }
						currency="USD"
						hidePriceFraction
					/>
					<Button
						href={ getRedirectUrl( 'jetpack-social-basic-plan-plugin-admin-page', {
							site: siteSuffix,
							query: 'redirect_to=' + window.location.href,
						} ) }
						fullWidth
					>
						{ __( 'Get Basic plan', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
				{ UNLIMITED_SHARES_TABLE_ITEM }
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem />
				<PricingTableItem />
				<PricingTableItem />
				<PricingTableItem />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice price={ 0 } legend="" currency="USD" hidePriceFraction />
					<Button
						fullWidth
						variant="secondary"
						onClick={ hidePricingPage }
						className={ isLarge && styles.button }
					>
						{ __( 'Start for free', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded
					label={ <strong>{ isLarge ? UP_TO_30 : UP_TO_30_SHARES }</strong> }
				/>
				<PricingTableItem />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem />
				<PricingTableItem />
				<PricingTableItem />
				<PricingTableItem />
			</PricingTableColumn>
		</PricingTable>
	);
};

export default PricingPage;
