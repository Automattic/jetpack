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
import { getScriptData } from '@automattic/jetpack-script-data';
import { Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useProductInfo from '../../../hooks/use-product-info';
import { store as socialStore } from '../../../social-store';
import styles from './styles.module.scss';

const PricingPage = ( { onDismiss = () => {} } = {} ) => {
	const [ productInfo ] = useProductInfo();

	const blogID = getScriptData().site.wpcom.blog_id;
	const siteSuffix = getScriptData().site.suffix;

	const { setShowPricingPage } = useDispatch( socialStore );

	const [ isLarge ] = useBreakpointMatch( 'lg' );

	const hidePricingPage = useCallback( () => {
		setShowPricingPage( false );
		onDismiss();
	}, [ setShowPricingPage, onDismiss ] );

	return (
		<PricingTable
			showIntroOfferDisclaimer
			title={ __( 'Write once, post everywhere', 'jetpack-publicize-components' ) }
			items={ [
				{ name: __( 'Priority support', 'jetpack-publicize-components' ) },
				{ name: __( 'Schedule posting', 'jetpack-publicize-components' ) },
				{
					name: __(
						'Share to Facebook, Instagram, LinkedIn, Mastodon, Tumblr, Threads, Bluesky, and Nextdoor',
						'jetpack-publicize-components'
					),
				},
				{ name: __( 'Customize publications', 'jetpack-publicize-components' ) },
				{
					name: __( 'Recycle content', 'jetpack-publicize-components' ),
					tooltipInfo: __(
						'Repurpose, reuse or republish already published content.',
						'jetpack-publicize-components'
					),
				},
				{
					name: __( 'Upload custom images with your posts', 'jetpack-publicize-components' ),
				},
				{
					name: __( 'Upload videos with your posts', 'jetpack-publicize-components' ),
				},
				{
					name: __( 'Automatically generate images for posts', 'jetpack-publicize-components' ),
					tooltipInfo: __(
						'Automatically create custom images, saving you hours of tedious work.',
						'jetpack-publicize-components'
					),
				},
				{
					name: __( 'Multi-image sharing', 'jetpack-publicize-components' ),
					tooltipTitle: __( 'Coming soon', 'jetpack-publicize-components' ),
					tooltipInfo: __(
						'Share multiple images at once on social media platforms.',
						'jetpack-publicize-components'
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
							legend={ __(
								'per month for the first year, then billed yearly',
								'jetpack-publicize-components'
							) }
							currency={ productInfo?.currencyCode }
							hidePriceFraction
						/>
					) : (
						<Spinner className={ styles.spinner } />
					) }
					<Button
						href={ getRedirectUrl( 'jetpack-social-v1-plan-plugin-admin-page', {
							site: blogID ? blogID.toString() : siteSuffix,
							query: 'redirect_to=admin.php?page=jetpack-social',
						} ) }
						fullWidth
					>
						{ __( 'Get Social', 'jetpack-publicize-components' ) }
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
				<PricingTableItem isIncluded={ false } isComingSoon />
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
						{ __( 'Start for free', 'jetpack-publicize-components' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
			</PricingTableColumn>
		</PricingTable>
	);
};

export default PricingPage;
