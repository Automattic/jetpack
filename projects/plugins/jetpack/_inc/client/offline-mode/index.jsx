import { AdminPage, AdminSection, Col, Container } from '@automattic/jetpack-components';
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
import { Badge } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import {
	activateModule as activateModuleAction,
	deactivateModule as deactivateModuleAction,
	fetchModules as fetchModulesAction,
} from 'state/modules';

import './style.scss';

const OFFLINE_MODE_FEATURES_PATH = '/jetpack/v4/offline-mode/features';
const EMPTY_FEATURES = [];
const EMPTY_GROUPS = {};

const REQUIRES_CONNECTION_FEATURES = [
	{
		name: __( 'Jetpack AI', 'jetpack' ),
		description: __(
			'Requires a WordPress.com connection to generate and process AI content.',
			'jetpack'
		),
	},
	{
		name: __( 'Stats', 'jetpack' ),
		description: __( 'Requires a connection to collect and display site traffic data.', 'jetpack' ),
	},
	{
		name: __( 'Backups', 'jetpack' ),
		description: __( 'Requires a connection to store backups and manage restores.', 'jetpack' ),
	},
	{
		name: __( 'Scan', 'jetpack' ),
		description: __(
			'Requires a connection to scan site files and receive security results.',
			'jetpack'
		),
	},
	{
		name: __( 'Search', 'jetpack' ),
		description: __( 'Requires a connection to index site content for Jetpack Search.', 'jetpack' ),
	},
	{
		name: __( 'VideoPress', 'jetpack' ),
		description: __( 'Requires a connection to upload, process, and serve videos.', 'jetpack' ),
	},
	{
		name: __( 'Social publishing', 'jetpack' ),
		description: __(
			'Requires a connection to publish posts to connected social accounts.',
			'jetpack'
		),
	},
];

const hasOwn = ( object, property ) => Object.prototype.hasOwnProperty.call( object, property );

const getFeatureModule = feature => feature.underlying_module || feature.module || feature.slug;

const getRecommendedInactiveFeatures = features =>
	features.filter( feature => feature.recommended && feature.available && ! feature.active );

const settlePromise = promise =>
	promise.then(
		value => ( { status: 'fulfilled', value } ),
		reason => ( { status: 'rejected', reason } )
	);

const getGroupedFeatures = ( features, groups ) => {
	return features.reduce( ( grouped, feature ) => {
		const groupSlug = feature.group || 'other';
		const groupName = groups[ groupSlug ] || __( 'Other features', 'jetpack' );

		if ( ! grouped[ groupSlug ] ) {
			grouped[ groupSlug ] = {
				name: groupName,
				features: [],
			};
		}

		grouped[ groupSlug ].features.push( feature );

		return grouped;
	}, {} );
};

const getFeatureActiveState = ( feature, activeOverrides ) => {
	const module = getFeatureModule( feature );

	if ( hasOwn( activeOverrides, module ) ) {
		return activeOverrides[ module ];
	}

	return feature.active;
};

const FeatureStatusBadge = ( { active, isUpdating } ) => {
	if ( isUpdating ) {
		return <Badge intent="draft">{ __( 'Saving', 'jetpack' ) }</Badge>;
	}

	if ( active ) {
		return <Badge intent="stable">{ __( 'Active', 'jetpack' ) }</Badge>;
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

	return (
		<div className="jp-offline-mode__feature-row">
			<ToggleControl
				checked={ feature.active }
				disabled={ ! feature.available || isUpdating }
				label={ feature.name }
				onChange={ handleToggle }
				__nextHasNoMarginBottom
			/>
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
				{ feature.limitation && (
					<Notice className="jp-offline-mode__limitation" isDismissible={ false } status="info">
						{ feature.limitation }
					</Notice>
				) }
			</div>
			<HStack alignment="center" expanded={ false } justify="flex-end" spacing={ 2 } wrap>
				{ feature.recommended && <Badge intent="draft">{ __( 'Recommended', 'jetpack' ) }</Badge> }
				{ 'partial' === feature.type && (
					<Badge intent="informational">{ __( 'Partial support', 'jetpack' ) }</Badge>
				) }
				<FeatureStatusBadge active={ feature.active } isUpdating={ isUpdating } />
			</HStack>
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
		type: PropTypes.string.isRequired,
		underlying_module: PropTypes.string,
	} ).isRequired,
	isUpdating: PropTypes.bool.isRequired,
	onActivate: PropTypes.func.isRequired,
	onDeactivate: PropTypes.func.isRequired,
};

const FeatureGroup = ( { group, updatingModules, onActivate, onDeactivate } ) => (
	<Card isBorderless={ false } size="small">
		<CardHeader>
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

const RequiresConnectionSection = () => (
	<Card isBorderless={ false } size="small">
		<CardHeader>
			<VStack spacing={ 1 }>
				<Text as="h2" size={ 14 } weight={ 600 }>
					{ __( 'Requires connection', 'jetpack' ) }
				</Text>
				<Text as="p" size={ 13 } variant="muted">
					{ __(
						'These Jetpack features are shown for planning purposes and are unavailable while the site is offline.',
						'jetpack'
					) }
				</Text>
			</VStack>
		</CardHeader>
		{ REQUIRES_CONNECTION_FEATURES.map( ( feature, index ) => (
			<Fragment key={ feature.name }>
				{ index > 0 && <CardDivider /> }
				<CardBody>
					<HStack alignment="flex-start" justify="space-between" spacing={ 4 } wrap>
						<VStack spacing={ 1 }>
							<Text as="h3" size={ 14 } weight={ 500 }>
								{ feature.name }
							</Text>
							<Text as="p" size={ 13 } variant="muted">
								{ feature.description }
							</Text>
						</VStack>
						<Badge intent="medium">{ __( 'Connection required', 'jetpack' ) }</Badge>
					</HStack>
				</CardBody>
			</Fragment>
		) ) }
	</Card>
);

const EnableRecommendedButton = ( { canEnableRecommended, isSaving, onEnableRecommended } ) => (
	<Button
		disabled={ ! canEnableRecommended || isSaving }
		onClick={ onEnableRecommended }
		variant="secondary"
		__next40pxDefaultSize
	>
		{ __( 'Enable recommended', 'jetpack' ) }
	</Button>
);

EnableRecommendedButton.propTypes = {
	canEnableRecommended: PropTypes.bool.isRequired,
	isSaving: PropTypes.bool.isRequired,
	onEnableRecommended: PropTypes.func.isRequired,
};

const OfflineModePage = ( { actions = null, apiNonce = '', apiRoot = '', children } ) => (
	<AdminPage
		actions={ actions }
		apiNonce={ apiNonce }
		apiRoot={ apiRoot }
		subTitle={ __(
			'Build and test Jetpack features without a WordPress.com connection.',
			'jetpack'
		) }
		title={ __( 'Offline Mode', 'jetpack' ) }
	>
		<AdminSection>
			<Container className="jp-offline-mode__container" horizontalSpacing={ 6 } horizontalGap={ 3 }>
				<Col sm={ 4 } md={ 8 } lg={ 12 }>
					<div className="jp-offline-mode">{ children }</div>
				</Col>
			</Container>
		</AdminSection>
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
	const groups = dashboardData?.groups || EMPTY_GROUPS;
	const featuresWithOptimisticState = useMemo(
		() =>
			features.map( feature => ( {
				...feature,
				active: getFeatureActiveState( feature, activeOverrides ),
			} ) ),
		[ activeOverrides, features ]
	);
	const groupedFeatures = useMemo(
		() => getGroupedFeatures( featuresWithOptimisticState, groups ),
		[ featuresWithOptimisticState, groups ]
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

	if ( 0 === featuresWithOptimisticState.length ) {
		return (
			<OfflineModePage
				actions={
					<EnableRecommendedButton
						canEnableRecommended={ false }
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
					<RequiresConnectionSection />
				</VStack>
			</OfflineModePage>
		);
	}

	return (
		<OfflineModePage
			actions={
				<EnableRecommendedButton
					canEnableRecommended={ recommendedInactiveFeatures.length > 0 }
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
				<RequiresConnectionSection />
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

export default connect( null, {
	activateModule: activateModuleAction,
	deactivateModule: deactivateModuleAction,
	fetchModules: fetchModulesAction,
} )( OfflineMode );
