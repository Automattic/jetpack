import { AdminPage, Col, Container } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Badge, Icon, LinkButton, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import GoBackLink from '../../go-back-link';
import { FeatureIcon } from './feature-icon';
import { FeatureLinks } from './feature-links';
import { FeaturePagination } from './feature-pagination';
import { FeatureScreenshot } from './feature-screenshot';
import { useFeatureStates } from './feature-state';
import { FeatureSwitch } from './feature-switch';
import styles from './styles.module.scss';

/**
 * A single feature's page: what it does, what it looks like, and how to switch it on.
 *
 * Deliberately not the pricing interstitial. A paid feature links out to plans from
 * here, rather than dropping someone straight into a purchase flow.
 *
 * @return The rendered component.
 */
export function FeatureDetail() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const features = useMemo(
		() => ( getMyJetpackWindowInitialState( 'mainFeatures' ) || [] ) as MainFeature[],
		[]
	);
	const states = useFeatureStates( features );
	const index = states.findIndex( item => item.feature.slug === slug );
	const state = index === -1 ? undefined : states[ index ];
	const { recordEvent } = useAnalytics();

	// `useGoBack` walks browser history, which after stepping through previous/next
	// lands on another feature rather than the list. Let the link go to /features.
	const onClickGoBack = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_features_back_click', { feature: slug } );
	}, [ recordEvent, slug ] );

	if ( ! state ) {
		navigate( '/features', { replace: true } );
		return null;
	}

	const { feature, product } = state;
	const isActive = state.status === 'active';
	const highlights = product?.features ?? [];

	return (
		<AdminPage
			showBackground={ true }
			breadcrumbs={
				<GoBackLink
					onClick={ onClickGoBack }
					to="/features"
					label={ __( 'Back to features', 'jetpack-my-jetpack' ) }
				/>
			}
		>
			<Container horizontalSpacing={ 6 } horizontalGap={ 4 }>
				<Col sm={ 4 } md={ 4 } lg={ 6 }>
					<Stack direction="column" gap="lg" className={ styles[ 'detail-intro' ] }>
						<Stack direction="column" gap="sm">
							<Stack direction="row" align="center" gap="md">
								<FeatureIcon feature={ feature } />
								<Text variant="heading-2xl">{ feature.name }</Text>
							</Stack>

							<Stack direction="row" align="center" gap="sm" wrap="wrap">
								<Badge intent={ isActive ? 'stable' : 'none' }>
									{ isActive
										? __( 'Active', 'jetpack-my-jetpack' )
										: __( 'Inactive', 'jetpack-my-jetpack' ) }
								</Badge>
								{ feature.essential ? (
									<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
								) : null }
							</Stack>

							<Text variant="body-lg" className={ styles[ 'detail-lede' ] }>
								{ product?.longDescription || feature.description }
							</Text>
						</Stack>

						<Stack direction="row" align="center" gap="sm" wrap="wrap">
							{ isActive && feature.manage_url ? (
								<LinkButton href={ feature.manage_url } variant="solid">
									{ __( 'Go to', 'jetpack-my-jetpack' ) }
								</LinkButton>
							) : null }
							<FeatureSwitch state={ state } />
							{ /* The upsell stays a deliberate second step, never the destination. */ }
							{ state.action === 'learn_more' && feature.learn_more_route ? (
								<LinkButton
									href={ `#${ feature.learn_more_route }` }
									variant="outline"
									tone="neutral"
								>
									{ __( 'See plans and pricing', 'jetpack-my-jetpack' ) }
								</LinkButton>
							) : null }
						</Stack>

						<FeatureLinks feature={ feature } />
					</Stack>
				</Col>

				<Col sm={ 4 } md={ 4 } lg={ 6 }>
					<FeatureScreenshot feature={ feature } />
				</Col>

				{ highlights.length > 0 && (
					<Col>
						<div className={ styles[ 'detail-highlights' ] }>
							<Text variant="heading-md">{ __( 'What you get', 'jetpack-my-jetpack' ) }</Text>
							<div className={ styles[ 'detail-highlights__grid' ] }>
								{ highlights.map( highlight => (
									<Stack
										key={ highlight }
										direction="row"
										align="start"
										gap="sm"
										className={ styles[ 'detail-highlight' ] }
									>
										<Icon icon={ check } size={ 20 } />
										<Text variant="body-md">{ highlight }</Text>
									</Stack>
								) ) }
							</div>
						</div>
					</Col>
				) }

				<Col>
					<FeaturePagination
						previous={ states[ index - 1 ]?.feature }
						next={ states[ index + 1 ]?.feature }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}
