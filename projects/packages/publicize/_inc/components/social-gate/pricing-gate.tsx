import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
import useProductInfo from '../../hooks/use-product-info';
import { store as socialStore } from '../../social-store';
import { getRefreshPlanQuery, getSocialScriptData } from '../../utils';

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
export default function PricingGate( { onDismiss }: { onDismiss: VoidFunction } ): JSX.Element {
	const [ productInfo ] = useProductInfo();
	const blogID = getScriptData().site.wpcom.blog_id;
	const siteSuffix = getScriptData().site.suffix;

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

	const price = productInfo?.v1?.introOffer ?? productInfo?.v1?.price;

	return (
		<div className="jetpack-social-gate">
			<Card.Root className="jetpack-social-gate__card">
				<Card.Content>
					<h2 className="jetpack-social-gate__title">
						{ __( 'Write once, post everywhere', 'jetpack-publicize-pkg' ) }
					</h2>
					<p className="jetpack-social-gate__subtitle">
						{ price != null
							? __(
									'Unlock scheduling, custom images, and more with a paid plan.',
									'jetpack-publicize-pkg'
							  )
							: __( 'Unlock the full power of Jetpack Social.', 'jetpack-publicize-pkg' ) }
					</p>
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
				</Card.Content>
			</Card.Root>
		</div>
	);
}
