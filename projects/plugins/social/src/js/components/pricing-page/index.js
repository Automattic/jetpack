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
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useProductInfo from '../../hooks/use-product-info';
import styles from './styles.module.scss';

const PricingPage = ( { onDismiss = () => {} } = {} ) => {
	const [ productInfo ] = useProductInfo();

	const siteSuffix = useSelect( select => select( SOCIAL_STORE_ID ).getSiteSuffix() );
	const blogID = useSelect( select => select( SOCIAL_STORE_ID ).getBlogID() );
	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateJetpackSettings;

	const [ isLarge ] = useBreakpointMatch( 'lg' );

	const hidePricingPage = useCallback( () => {
		const newOption = {
			show_pricing_page: false,
		};
		updateOptions( newOption );
		onDismiss();
	}, [ updateOptions, onDismiss ] );

	return (
		<PricingTable
			showIntroOfferDisclaimer
			title={ __( 'Write once, post everywhere', 'jetpack-social' ) }
			items={ [
				{ name: __( 'Priority support', 'jetpack-social' ) },
				{ name: __( 'Schedule posting', 'jetpack-social' ) },
				{
					name: __(
						'Instagram, Facebook, Mastodon, LinkedIn, Nextdoor, & Tumblr',
						'jetpack-social'
					),
				},
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
					tooltipInfo: __( 'Upload and share videos to your social platforms.', 'jetpack-social' ),
				},
				{
					name: __( 'Image generator', 'jetpack-social' ),
					tooltipInfo: __(
						'Automatically create custom images, saving you hours of tedious work.',
						'jetpack-social'
					),
				},
				{
					name: __( 'Multi-image sharing', 'jetpack-social' ),
					tooltipTitle: __( 'Coming soon', 'jetpack-social' ),
					tooltipInfo: __(
						'Share multiple images at once on social media platforms.',
						'jetpack-social'
					),
				},
			] }
		>
			<PricingTableColumn primary>
				<PricingTableHeader>
					{ productInfo?.v1 ? (
						<ProductPrice
							price={ productInfo?.v1?.price }
							offPrice={ productInfo?.v1?.introOffer }
							legend={ __( 'per month for the first year, then billed yearly', 'jetpack-social' ) }
							currency={ productInfo?.currencyCode }
							hidePriceFraction
						/>
					) : (
						<Spinner className={ styles.spinner } />
					) }
					<Button
						href={ getRedirectUrl( 'jetpack-social-v1-plan-plugin-admin-page', {
							site: blogID ?? siteSuffix,
							query: 'redirect_to=admin.php?page=jetpack-social',
						} ) }
						fullWidth
					>
						{ __( 'Get Social', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isComingSoon />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice
						price={ 0 }
						legend=""
						currency={ productInfo?.currencyCode || 'USD' }
						hidePriceFraction
					/>
					<Button
						fullWidth
						variant="secondary"
						onClick={ hidePricingPage }
						className={ isLarge && styles.button }
					>
						{ __( 'Start for free', 'jetpack-social' ) }
					</Button>
				</PricingTableHeader>
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
