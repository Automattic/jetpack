import {
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback } from 'react';
import useProductInfo from '../../../hooks/use-product-info';
import { store as socialStore } from '../../../social-store';
import { getRefreshPlanQuery, getSocialScriptData } from '../../../utils/script-data';
import styles from './styles.module.scss';

type PricingPageProps = {
	onDismiss: VoidFunction;
};

const PricingPage = ( { onDismiss }: PricingPageProps ) => {
	const [ productInfo ] = useProductInfo();

	const blogID = getScriptData().site.wpcom.blog_id;
	const siteSuffix = getScriptData().site.suffix;

	const { setShowPricingPage, updateSocialModuleSettings } = useDispatch( socialStore );

	const isEnablingSocial = useSelect(
		select => select( socialStore ).isSavingSocialModuleSettings(),
		[]
	);

	const { is_publicize_enabled: isSocialEnabled } = getSocialScriptData();

	const onGetSocialClick = useCallback( () => {
		window.location.href = getRedirectUrl( 'jetpack-social-v1-plan-plugin-admin-page', {
			site: blogID ? blogID.toString() : siteSuffix,
			query: getRefreshPlanQuery(),
		} );
	}, [ blogID, siteSuffix ] );

	const startForFree = useCallback( async () => {
		// First let us activate the Social module, if it is not already enabled
		// Because saving the settings won't work if the module is not enabled
		if ( ! isSocialEnabled ) {
			await updateSocialModuleSettings( { publicize: true } );
		}
		// Then we save the settings to not show the pricing page again
		setShowPricingPage( false );

		// If the module was NOT enabled, we need to refresh the page
		if ( ! isSocialEnabled ) {
			return window.location.reload();
		}

		// Otherwise dismiss the pricing page
		onDismiss();
	}, [ updateSocialModuleSettings, setShowPricingPage, onDismiss, isSocialEnabled ] );

	return (
		<PricingTable
			showIntroOfferDisclaimer
			title={ __( 'Write once, post everywhere', 'jetpack-publicize-pkg' ) }
			items={ [
				{ name: __( 'Priority support', 'jetpack-publicize-pkg' ) },
				{ name: __( 'Schedule posting', 'jetpack-publicize-pkg' ) },
				{
					name: __(
						'Share to Facebook, Instagram, LinkedIn, Mastodon, Tumblr, Threads, Bluesky, and Nextdoor',
						'jetpack-publicize-pkg'
					),
				},
				{ name: __( 'Customize publications', 'jetpack-publicize-pkg' ) },
				{
					name: __( 'Recycle content', 'jetpack-publicize-pkg' ),
					tooltipInfo: __(
						'Repurpose, reuse or republish already published content.',
						'jetpack-publicize-pkg'
					),
				},
				{
					name: __( 'Upload custom images with your posts', 'jetpack-publicize-pkg' ),
				},
				{
					name: __( 'Upload videos with your posts', 'jetpack-publicize-pkg' ),
				},
				{
					name: __( 'Automatically generate images for posts', 'jetpack-publicize-pkg' ),
					tooltipInfo: __(
						'Automatically create custom images, saving you hours of tedious work.',
						'jetpack-publicize-pkg'
					),
				},
				{
					name: __( 'Multi-image sharing', 'jetpack-publicize-pkg' ),
					tooltipTitle: __( 'Coming soon', 'jetpack-publicize-pkg' ),
					tooltipInfo: __(
						'Share multiple images at once on social media platforms.',
						'jetpack-publicize-pkg'
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
								'jetpack-publicize-pkg'
							) }
							currency={ productInfo?.currencyCode }
							hidePriceFraction
						/>
					) : (
						<Spinner className={ styles.spinner } />
					) }
					<Button onClick={ onGetSocialClick } className={ styles[ 'cta-button' ] }>
						{ __( 'Get Social', 'jetpack-publicize-pkg' ) }
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
						variant="outline"
						onClick={ startForFree }
						className={ styles[ 'cta-button' ] }
						disabled={ isEnablingSocial }
					>
						{ isEnablingSocial
							? __( 'Please wait…', 'jetpack-publicize-pkg' )
							: _x(
									'Start for free',
									'Pricing page CTA for Social admin page',
									'jetpack-publicize-pkg'
							  ) }
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
