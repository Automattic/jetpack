import AdminPage from '@automattic/jetpack-components/admin-page';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CardDivider,
	CardHeader,
	ExternalLink,
	Notice,
	Spinner,
	ToggleControl,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, published } from '@wordpress/icons';
import { Badge } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import './style.scss';

const OFFLINE_MODE_FEATURES_PATH = '/jetpack/v4/offline-mode/features';
const EMPTY_FEATURES = [];
const EMPTY_REQUIRES_CONNECTION_FEATURES = [];
const PRODUCT_GROUP_ORDER = [ 'growth', 'performance', 'security', 'other' ];
const FEATURE_PRODUCT_GROUPS = {
	'activity-log': 'security',
	'contact-form': 'growth',
	'jetpack-ai': 'growth',
	'account-protection': 'security',
	comments: 'growth',
	'comment-likes': 'growth',
	monitor: 'security',
	newsletter: 'growth',
	notes: 'security',
	payments: 'growth',
	photon: 'performance',
	'photon-cdn': 'performance',
	publicize: 'growth',
	protect: 'security',
	'related-posts': 'growth',
	scan: 'security',
	search: 'performance',
	sharedaddy: 'growth',
	sso: 'security',
	stats: 'growth',
	subscriptions: 'growth',
	vaultpress: 'security',
	videopress: 'performance',
	waf: 'security',
	'woocommerce-analytics': 'growth',
	wordads: 'growth',
};
const FEATURE_GROUP_PRODUCT_GROUPS = {
	boost: 'performance',
	design: 'other',
	forms: 'growth',
	media: 'performance',
	newsletter: 'growth',
	other: 'other',
	protect: 'security',
	search: 'growth',
	social: 'growth',
	'vaultpress-backups': 'security',
	writing: 'other',
};

const hasOwn = ( object, property ) => Object.prototype.hasOwnProperty.call( object, property );

const getFeatureModule = feature => feature.underlying_module || feature.module || feature.slug;

const getProductGroupName = groupSlug => {
	const groupNames = {
		growth: __( 'Grow your audience', 'jetpack' ),
		performance: __( 'Speed up your site', 'jetpack' ),
		security: __( 'Protect your site', 'jetpack' ),
		other: __( 'Other features', 'jetpack' ),
	};

	return groupNames[ groupSlug ] || groupNames.other;
};

const getProductGroupSlug = feature => {
	const featureModule = getFeatureModule( feature );

	return (
		FEATURE_PRODUCT_GROUPS[ feature.slug ] ||
		FEATURE_PRODUCT_GROUPS[ featureModule ] ||
		FEATURE_GROUP_PRODUCT_GROUPS[ feature.group ] ||
		'other'
	);
};

const getRecommendedFeatures = features =>
	features.filter(
		feature => feature.recommended && feature.available && false !== feature.toggleable
	);

const getRecommendedInactiveFeatures = features =>
	getRecommendedFeatures( features ).filter( feature => ! feature.active );

const settlePromise = promise =>
	promise.then(
		value => ( { status: 'fulfilled', value } ),
		reason => ( { status: 'rejected', reason } )
	);

const getGroupedFeatures = features => {
	const groupedFeatures = features.reduce( ( grouped, feature ) => {
		const groupSlug = getProductGroupSlug( feature );
		const groupName = getProductGroupName( groupSlug );

		if ( ! grouped[ groupSlug ] ) {
			grouped[ groupSlug ] = {
				name: groupName,
				features: [],
			};
		}

		grouped[ groupSlug ].features.push( feature );

		return grouped;
	}, {} );

	return PRODUCT_GROUP_ORDER.reduce( ( orderedGroups, groupSlug ) => {
		if ( groupedFeatures[ groupSlug ] ) {
			orderedGroups[ groupSlug ] = groupedFeatures[ groupSlug ];
		}

		return orderedGroups;
	}, {} );
};

const getFeatureActiveState = ( feature, activeOverrides ) => {
	const module = getFeatureModule( feature );

	if ( hasOwn( activeOverrides, module ) ) {
		return activeOverrides[ module ];
	}

	return feature.active;
};

const isConnectionRequiredFeature = feature =>
	'requires_connection' === feature.type || ! feature.available;

const JetpackHeaderIcon = () => (
	<svg
		aria-hidden="true"
		className="jp-offline-mode__header-icon"
		focusable="false"
		height="20"
		viewBox="0 0 32 32"
		width="20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"
			fill="#069e08"
		/>
	</svg>
);

const FeatureStatusBadge = ( { active, isUpdating } ) => {
	if ( isUpdating ) {
		return <Badge intent="draft">{ __( 'Saving', 'jetpack' ) }</Badge>;
	}

	if ( active ) {
		return (
			<Badge
				className="jp-offline-mode__status-badge jp-offline-mode__status-badge--active"
				intent="stable"
			>
				<Icon className="jp-offline-mode__status-badge-icon" icon={ published } size={ 12 } />
				{ __( 'Active', 'jetpack' ) }
			</Badge>
		);
	}

	return <Badge intent="draft">{ __( 'Inactive', 'jetpack' ) }</Badge>;
};

FeatureStatusBadge.propTypes = {
	active: PropTypes.bool.isRequired,
	isUpdating: PropTypes.bool.isRequired,
};

const FeatureRow = ( { feature, isUpdating, onActivate, onDeactivate } ) => {
	const module = getFeatureModule( feature );
	const documentationLabel = sprintf(
		/* translators: %s: Jetpack feature name. */
		__( 'View %s documentation', 'jetpack' ),
		feature.name
	);
	const handleToggle = useCallback( () => {
		return feature.active ? onDeactivate( module ) : onActivate( module );
	}, [ feature.active, module, onActivate, onDeactivate ] );
	const isConnectionRequired = isConnectionRequiredFeature( feature );
	const isToggleable = ! isConnectionRequired && false !== feature.toggleable;

	return (
		<div aria-label={ feature.name } className="jp-offline-mode__feature-row" role="group">
			{ isToggleable ? (
				<ToggleControl
					checked={ feature.active }
					disabled={ ! feature.available || isUpdating }
					label={ feature.name }
					onChange={ handleToggle }
					__nextHasNoMarginBottom
				/>
			) : (
				<Text as="h3" className="jp-offline-mode__feature-name" size={ 14 } weight={ 500 }>
					{ feature.name }
				</Text>
			) }
			<div className="jp-offline-mode__feature-copy">
				<Text as="p" size={ 13 } variant="muted">
					{ feature.description }
					{ feature.documentation_url && (
						<ExternalLink
							aria-label={ documentationLabel }
							className="jp-offline-mode__feature-documentation-link"
							href={ feature.documentation_url }
							title={ documentationLabel }
						>
							<span className="screen-reader-text">{ documentationLabel }</span>
						</ExternalLink>
					) }
				</Text>
			</div>
			<HStack
				alignment="center"
				className="jp-offline-mode__feature-badges"
				expanded={ false }
				justify="flex-end"
				spacing={ 2 }
				wrap
			>
				{ feature.recommended && ! isConnectionRequired && (
					<Badge intent="draft">{ __( 'Recommended', 'jetpack' ) }</Badge>
				) }
				{ 'partial' === feature.type && ! isConnectionRequired && (
					<Badge intent="informational">{ __( 'Partial support', 'jetpack' ) }</Badge>
				) }
				{ ! isToggleable && ! isConnectionRequired && (
					<Badge intent="stable">{ __( 'Always available', 'jetpack' ) }</Badge>
				) }
				{ isToggleable && (
					<FeatureStatusBadge active={ feature.active } isUpdating={ isUpdating } />
				) }
				{ isConnectionRequired && (
					<Badge className="jp-offline-mode__connection-required-badge" intent="medium">
						{ __( 'Connection required', 'jetpack' ) }
					</Badge>
				) }
			</HStack>
			{ feature.limitation && ! isConnectionRequired && (
				<div
					aria-label={ sprintf(
						/* translators: %s: Offline Mode feature name. */
						__( '%s limitation', 'jetpack' ),
						feature.name
					) }
					className="jp-offline-mode__limitation"
					role="note"
				>
					<Notice
						className="jp-offline-mode__limitation-notice"
						isDismissible={ false }
						status="info"
					>
						{ feature.limitation }
					</Notice>
				</div>
			) }
		</div>
	);
};

FeatureRow.propTypes = {
	feature: PropTypes.shape( {
		active: PropTypes.bool.isRequired,
		available: PropTypes.bool.isRequired,
		description: PropTypes.string.isRequired,
		documentation_url: PropTypes.string,
		limitation: PropTypes.string,
		module: PropTypes.string,
		name: PropTypes.string.isRequired,
		recommended: PropTypes.bool.isRequired,
		slug: PropTypes.string.isRequired,
		toggleable: PropTypes.bool,
		type: PropTypes.string.isRequired,
		underlying_module: PropTypes.string,
	} ).isRequired,
	isUpdating: PropTypes.bool.isRequired,
	onActivate: PropTypes.func.isRequired,
	onDeactivate: PropTypes.func.isRequired,
};

const FeatureGroup = ( { group, updatingModules, onActivate, onDeactivate } ) => (
	<Card className="jp-offline-mode__feature-group" isBorderless={ false } size="small">
		<CardHeader className="jp-offline-mode__feature-group-header">
			<Text as="h2" size={ 14 } weight={ 600 }>
				{ group.name }
			</Text>
		</CardHeader>
		{ group.features.map( ( feature, index ) => {
			const module = getFeatureModule( feature );

			return (
				<Fragment key={ feature.slug }>
					{ index > 0 && <CardDivider /> }
					<CardBody>
						<FeatureRow
							feature={ feature }
							isUpdating={ updatingModules.includes( module ) }
							onActivate={ onActivate }
							onDeactivate={ onDeactivate }
						/>
					</CardBody>
				</Fragment>
			);
		} ) }
	</Card>
);

FeatureGroup.propTypes = {
	group: PropTypes.shape( {
		name: PropTypes.string.isRequired,
		features: PropTypes.arrayOf( FeatureRow.propTypes.feature ).isRequired,
	} ).isRequired,
	onActivate: PropTypes.func.isRequired,
	onDeactivate: PropTypes.func.isRequired,
	updatingModules: PropTypes.arrayOf( PropTypes.string ).isRequired,
};

const EnableRecommendedButton = ( {
	canEnableRecommended,
	hasRecommendedFeatures,
	isSaving,
	onEnableRecommended,
} ) => {
	let label = __( 'Enable recommended', 'jetpack' );

	if ( ! canEnableRecommended ) {
		label = hasRecommendedFeatures
			? __( 'Recommended enabled', 'jetpack' )
			: __( 'No recommended features', 'jetpack' );
	}

	return (
		<Button
			className="jp-offline-mode__recommended-button jp-offline-mode__recommended-button--with-icon"
			disabled={ ! canEnableRecommended || isSaving }
			onClick={ onEnableRecommended }
			size="compact"
			variant="secondary"
		>
			<Icon className="jp-offline-mode__recommended-button-icon" icon={ published } size={ 16 } />
			{ label }
		</Button>
	);
};

EnableRecommendedButton.propTypes = {
	canEnableRecommended: PropTypes.bool.isRequired,
	hasRecommendedFeatures: PropTypes.bool.isRequired,
	isSaving: PropTypes.bool.isRequired,
	onEnableRecommended: PropTypes.func.isRequired,
};

const OfflineModePage = ( { actions = null, apiNonce = '', apiRoot = '', children } ) => (
	<AdminPage
		actions={ actions }
		apiNonce={ apiNonce }
		apiRoot={ apiRoot }
		className="jp-offline-mode__admin-page"
		logo={ <JetpackHeaderIcon /> }
		subTitle={ __(
			'Build and test Jetpack features without a WordPress.com connection.',
			'jetpack'
		) }
		title={ __( 'Offline Mode', 'jetpack' ) }
		unwrapped
	>
		<div className="jp-offline-mode__container">
			<div className="jp-offline-mode">{ children }</div>
		</div>
	</AdminPage>
);

OfflineModePage.propTypes = {
	actions: PropTypes.node,
	apiNonce: PropTypes.string,
	apiRoot: PropTypes.string,
	children: PropTypes.node.isRequired,
};

export const OfflineMode = ( {
	activateModule,
	apiNonce = '',
	apiRoot = '',
	deactivateModule,
	fetchModules,
} ) => {
	const [ dashboardData, setDashboardData ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ updatingModules, setUpdatingModules ] = useState( [] );
	const [ activeOverrides, setActiveOverrides ] = useState( {} );

	useEffect( () => {
		document.body.classList.add( 'jetpack-offline-mode-page' );

		return () => document.body.classList.remove( 'jetpack-offline-mode-page' );
	}, [] );

	const loadDashboardData = useCallback( ( { showError = false, showLoading = false } = {} ) => {
		if ( showLoading ) {
			setIsLoading( true );
		}

		if ( showError ) {
			setError( null );
		}

		return apiFetch( { path: OFFLINE_MODE_FEATURES_PATH } )
			.then( response => {
				setDashboardData( response );
			} )
			.catch( () => {
				if ( showError ) {
					setError( __( 'Offline Mode features could not be loaded.', 'jetpack' ) );
				}
			} )
			.finally( () => {
				if ( showLoading ) {
					setIsLoading( false );
				}
			} );
	}, [] );

	useEffect( () => {
		loadDashboardData( { showError: true, showLoading: true } );
	}, [ loadDashboardData ] );

	const features = dashboardData?.features || EMPTY_FEATURES;
	const requiresConnectionFeatures =
		dashboardData?.requires_connection || EMPTY_REQUIRES_CONNECTION_FEATURES;
	const featuresWithOptimisticState = useMemo(
		() =>
			features.map( feature => ( {
				...feature,
				active: getFeatureActiveState( feature, activeOverrides ),
			} ) ),
		[ activeOverrides, features ]
	);
	const productFeatures = useMemo(
		() => [ ...featuresWithOptimisticState, ...requiresConnectionFeatures ],
		[ featuresWithOptimisticState, requiresConnectionFeatures ]
	);
	const groupedFeatures = useMemo(
		() => getGroupedFeatures( productFeatures ),
		[ productFeatures ]
	);
	const recommendedFeatures = useMemo(
		() => getRecommendedFeatures( featuresWithOptimisticState ),
		[ featuresWithOptimisticState ]
	);
	const recommendedInactiveFeatures = useMemo(
		() => getRecommendedInactiveFeatures( featuresWithOptimisticState ),
		[ featuresWithOptimisticState ]
	);
	const isAnyFeatureUpdating = updatingModules.length > 0;

	const markModuleUpdating = useCallback( module => {
		setUpdatingModules( currentModules =>
			currentModules.includes( module ) ? currentModules : [ ...currentModules, module ]
		);
	}, [] );

	const unmarkModuleUpdating = useCallback( module => {
		setUpdatingModules( currentModules =>
			currentModules.filter( updatingModule => updatingModule !== module )
		);
	}, [] );

	const setModuleActiveOverride = useCallback( ( module, active ) => {
		setActiveOverrides( currentOverrides => ( {
			...currentOverrides,
			[ module ]: active,
		} ) );
	}, [] );

	const removeModuleActiveOverride = useCallback( module => {
		setActiveOverrides( currentOverrides => {
			if ( ! hasOwn( currentOverrides, module ) ) {
				return currentOverrides;
			}

			const nextOverrides = { ...currentOverrides };
			delete nextOverrides[ module ];
			return nextOverrides;
		} );
	}, [] );

	const refreshModules = useCallback( () => {
		return Promise.all( [ fetchModules(), loadDashboardData() ] );
	}, [ fetchModules, loadDashboardData ] );

	const updateModule = useCallback(
		( module, active, action ) => {
			markModuleUpdating( module );
			setModuleActiveOverride( module, active );

			return action( module )
				.then( refreshModules )
				.catch( () => {
					removeModuleActiveOverride( module );
				} )
				.finally( () => {
					removeModuleActiveOverride( module );
					unmarkModuleUpdating( module );
				} );
		},
		[
			markModuleUpdating,
			refreshModules,
			removeModuleActiveOverride,
			setModuleActiveOverride,
			unmarkModuleUpdating,
		]
	);

	const handleActivate = useCallback(
		module => updateModule( module, true, activateModule ),
		[ activateModule, updateModule ]
	);

	const handleDeactivate = useCallback(
		module => updateModule( module, false, deactivateModule ),
		[ deactivateModule, updateModule ]
	);

	const handleActivateRecommended = useCallback( () => {
		const modules = recommendedInactiveFeatures.map( getFeatureModule );

		modules.forEach( module => {
			markModuleUpdating( module );
			setModuleActiveOverride( module, true );
		} );

		return Promise.all( modules.map( module => settlePromise( activateModule( module ) ) ) )
			.then( refreshModules )
			.finally( () => {
				modules.forEach( module => {
					removeModuleActiveOverride( module );
					unmarkModuleUpdating( module );
				} );
			} );
	}, [
		activateModule,
		markModuleUpdating,
		recommendedInactiveFeatures,
		removeModuleActiveOverride,
		refreshModules,
		setModuleActiveOverride,
		unmarkModuleUpdating,
	] );

	if ( isLoading ) {
		return (
			<OfflineModePage apiNonce={ apiNonce } apiRoot={ apiRoot }>
				<HStack
					alignment="center"
					className="jp-offline-mode--loading"
					justify="center"
					spacing={ 2 }
				>
					<Spinner />
					<span>{ __( 'Loading Offline Mode features…', 'jetpack' ) }</span>
				</HStack>
			</OfflineModePage>
		);
	}

	if ( error ) {
		return (
			<OfflineModePage apiNonce={ apiNonce } apiRoot={ apiRoot }>
				<Notice isDismissible={ false } status="error">
					{ error }
				</Notice>
			</OfflineModePage>
		);
	}

	if ( 0 === productFeatures.length ) {
		return (
			<OfflineModePage
				actions={
					<EnableRecommendedButton
						canEnableRecommended={ false }
						hasRecommendedFeatures={ false }
						isSaving={ false }
						onEnableRecommended={ handleActivateRecommended }
					/>
				}
				apiNonce={ apiNonce }
				apiRoot={ apiRoot }
			>
				<VStack as="main" className="jp-offline-mode__content" spacing={ 6 }>
					<Notice isDismissible={ false } status="info">
						{ __( 'No offline-safe features are available for this site.', 'jetpack' ) }
					</Notice>
				</VStack>
			</OfflineModePage>
		);
	}

	return (
		<OfflineModePage
			actions={
				<EnableRecommendedButton
					canEnableRecommended={ recommendedInactiveFeatures.length > 0 }
					hasRecommendedFeatures={ recommendedFeatures.length > 0 }
					isSaving={ isAnyFeatureUpdating }
					onEnableRecommended={ handleActivateRecommended }
				/>
			}
			apiNonce={ apiNonce }
			apiRoot={ apiRoot }
		>
			<VStack as="main" className="jp-offline-mode__content" spacing={ 6 }>
				<VStack spacing={ 6 }>
					{ Object.entries( groupedFeatures ).map( ( [ groupSlug, group ] ) => (
						<FeatureGroup
							group={ group }
							key={ groupSlug }
							onActivate={ handleActivate }
							onDeactivate={ handleDeactivate }
							updatingModules={ updatingModules }
						/>
					) ) }
				</VStack>
			</VStack>
		</OfflineModePage>
	);
};

OfflineMode.propTypes = {
	activateModule: PropTypes.func.isRequired,
	apiNonce: PropTypes.string,
	apiRoot: PropTypes.string,
	deactivateModule: PropTypes.func.isRequired,
	fetchModules: PropTypes.func.isRequired,
};
