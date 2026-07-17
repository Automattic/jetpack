import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { getScriptData } from '@automattic/jetpack-script-data';
import { formatCurrency } from '@automattic/number-formatters';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import useProductInfo from '../../hooks/use-product-info';
import { store as socialStore } from '../../social-store';
import { getRefreshPlanQuery, getSocialScriptData } from '../../utils';

const PAID_FEATURES = [
	__( 'Schedule posts in advance', 'jetpack-publicize-pkg' ),
	__( 'Customize each post per network', 'jetpack-publicize-pkg' ),
	__( 'Automatically generate social images', 'jetpack-publicize-pkg' ),
	__(
		'Share to Facebook, Instagram, LinkedIn, Mastodon, Tumblr, Threads, Bluesky, and Nextdoor',
		'jetpack-publicize-pkg'
	),
	__( 'Priority support', 'jetpack-publicize-pkg' ),
];

/**
 * Free-plan upsell gate for the modernization chassis. A compact native
 * `@wordpress/ui` replacement for the legacy two-column `PricingTable`: it surfaces the
 * paid price (from `useProductInfo`) with an upgrade CTA, plus a "Start for free" action
 * that enables the Social module and dismisses the nudge.
 *
 * @param props           - Component props.
 * @param props.onDismiss - Called after the nudge is dismissed.
 * @return The pricing gate.
 */
// TODO: Replace this bespoke card with the shared `PricingCard`
// (`@automattic/jetpack-components`) once it and the related pricing components
// are refactored onto `@wordpress/ui`. Recreated here because reworking those
// shared components affects every consumer and is out of scope for this work.
export default function PricingGate( { onDismiss }: { onDismiss: VoidFunction } ): JSX.Element {
	const [ productInfo ] = useProductInfo();
	const blogID = getScriptData().site.wpcom.blog_id;
	const siteSuffix = getScriptData().site.suffix;

	const currency = productInfo?.currencyCode ?? 'USD';
	const monthlyPrice = productInfo?.v1?.price ?? null;
	const introPrice = productInfo?.v1?.introOffer ?? null;

	// Drop the trailing `.00` the currency would otherwise add, but keep cents
	// when the price isn't a whole unit.
	const formatPrice = useCallback(
		( amount: number ) => formatCurrency( amount, currency, { stripZeros: true } ),
		[ currency ]
	);

	const { setShowPricingPage, updateSocialModuleSettings } = useDispatch( socialStore );
	const isEnabling = useSelect(
		select => select( socialStore ).isSavingSocialModuleSettings(),
		[]
	);
	// Snapshot from page-load script data (not a live store value); the
	// `! isSocialEnabled` branch in onStartForFree reloads the page, matching
	// the legacy pricing page's behaviour.
	const { is_publicize_enabled: isSocialEnabled } = getSocialScriptData();

	const onGetSocial = useCallback( () => {
		window.location.href = getRedirectUrl( 'jetpack-social-v1-plan-plugin-admin-page', {
			site: blogID ? blogID.toString() : siteSuffix,
			query: getRefreshPlanQuery(),
		} );
	}, [ blogID, siteSuffix ] );

	const onStartForFree = useCallback( async () => {
		if ( ! isSocialEnabled ) {
			await updateSocialModuleSettings( { publicize: true } );
		}
		setShowPricingPage( false );
		if ( ! isSocialEnabled ) {
			window.location.reload();
			return;
		}
		onDismiss();
	}, [ isSocialEnabled, updateSocialModuleSettings, setShowPricingPage, onDismiss ] );

	return (
		<div className="jetpack-social-gate">
			<Card.Root className="jetpack-social-gate__card">
				<Card.Content>
					<h2 className="jetpack-social-gate__title">
						{ __( 'Write once, post everywhere', 'jetpack-publicize-pkg' ) }
					</h2>
					<p className="jetpack-social-gate__subtitle">
						{ monthlyPrice != null
							? __(
									'Unlock scheduling, custom images, and more with a paid plan.',
									'jetpack-publicize-pkg'
							  )
							: __( 'Unlock the full power of Jetpack Social.', 'jetpack-publicize-pkg' ) }
					</p>
					{ monthlyPrice != null && (
						<div className="jetpack-social-gate__price">
							<Stack direction="row" justify="center" align="baseline" gap="sm">
								<Text variant="heading-2xl">{ formatPrice( introPrice ?? monthlyPrice ) }</Text>
								{ introPrice != null && (
									<Text className="jetpack-social-gate__price-was">
										{ formatPrice( monthlyPrice ) }
									</Text>
								) }
							</Stack>
							<span className="jetpack-social-gate__price-legend">
								{ introPrice != null
									? __(
											'per month for the first year, then billed yearly',
											'jetpack-publicize-pkg'
									  )
									: __( 'per month, billed yearly', 'jetpack-publicize-pkg' ) }
							</span>
						</div>
					) }
					<Stack
						className="jetpack-social-gate__features"
						direction="column"
						gap="sm"
						render={ <ul /> }
					>
						{ PAID_FEATURES.map( feature => (
							<Stack
								key={ feature }
								className="jetpack-social-gate__feature"
								direction="row"
								align="center"
								gap="sm"
								render={ <li /> }
							>
								<Icon icon={ check } />
								<span>{ feature }</span>
							</Stack>
						) ) }
					</Stack>
					<Stack className="jetpack-social-gate__actions" direction="row" justify="center" gap="md">
						<Button variant="solid" onClick={ onGetSocial }>
							{ __( 'Get Social', 'jetpack-publicize-pkg' ) }
						</Button>
						<Button
							variant="outline"
							onClick={ onStartForFree }
							loading={ isEnabling }
							loadingAnnouncement={ __( 'Please wait…', 'jetpack-publicize-pkg' ) }
							disabled={ isEnabling }
						>
							{ isEnabling
								? __( 'Please wait…', 'jetpack-publicize-pkg' )
								: _x(
										'Start for free',
										'Pricing page CTA for Social admin page',
										'jetpack-publicize-pkg'
								  ) }
						</Button>
					</Stack>
				</Card.Content>
			</Card.Root>
		</div>
	);
}
