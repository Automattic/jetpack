/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	ANNUAL_DONATION,
	DEFAULT_TAB,
	MONTHLY_DONATION,
	ONE_TIME_DONATION,
} from './common/constants';
import Context from './common/context';
import Controls from './controls';
import fetchStatus from '../donations/fetch-status';
import fetchDefaultProducts from '../donations/fetch-default-products';
import LoadingError from '../donations/loading-error';
import StripeNudge from '../../shared/components/stripe-nudge';

const tabs = [
	{
		id: ONE_TIME_DONATION,
		label: __( 'One-Time', 'jetpack' ),
	},
	{
		id: MONTHLY_DONATION,
		label: __( 'Monthly', 'jetpack' ),
	},
	{
		id: ANNUAL_DONATION,
		label: __( 'Yearly', 'jetpack' ),
	},
];

const defaultProducts = {
	[ ONE_TIME_DONATION ]: -1,
	[ MONTHLY_DONATION ]: -1,
	[ ANNUAL_DONATION ]: -1,
};

const intervalMap = {
	'one-time': ONE_TIME_DONATION,
	'1 month': MONTHLY_DONATION,
	'1 year': ANNUAL_DONATION,
};

const DonationTabButton = ( { label, id, tabIndex, isActive, onActivateTab, color } ) => {
	const style = {
		backgroundColor: isActive ? color : 'white',
		color: isActive ? 'white' : 'inherit',
		borderColor: isActive ? color : 'inherit',
	};

	return (
		<div
			role="button"
			tabIndex={ tabIndex }
			className={ 'donations__nav-item' }
			style={ style }
			onClick={ () => onActivateTab( id ) }
			onKeyDown={ () => onActivateTab( id ) }
			key={ `jetpack-donations-nav-item-${ tabIndex }` }
		>
			{ label }
		</div>
	);
};

const Edit = props => {
	const { attributes, className } = props;
	const { currency, annualDonation, monthlyDonation, showCustomAmount } = attributes;

	const [ loadingError, setLoadingError ] = useState( '' );
	const [ computedBorderColor, setComputedBorderColor ] = useState( '' );
	const [ shouldUpgrade, setShouldUpgrade ] = useState( false );
	const [ stripeConnectUrl, setStripeConnectUrl ] = useState( false );
	const [ products, setProducts ] = useState( defaultProducts );
	const [ activeTab, setActiveTab ] = useState( DEFAULT_TAB );

	const fallbackLinkUrl = useSelect( select => select( 'core/editor' ).getCurrentPost(), [] ).link;
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );

	useEffect( () => {
		const query = `[data-block="${ props.clientId }"]`;
		const blockDomElement = document.querySelectorAll( query );
		setComputedBorderColor( window.getComputedStyle( blockDomElement[ 0 ] ).borderColor );
	}, [ props ] );

	const resetActiveTab = ( controlTab, value ) => {
		if ( value === false && activeTab === controlTab ) {
			setActiveTab( DEFAULT_TAB );
		}
	};

	const filterProducts = productList =>
		productList.reduce( ( filteredProducts, { id, currency: productCurrency, type, interval } ) => {
			if ( productCurrency === currency && type === 'donation' ) {
				const mappedInterval = intervalMap[ interval ];
				if ( mappedInterval ) {
					filteredProducts[ mappedInterval ] = id;
				}
			}
			return filteredProducts;
		}, {} );

	const hasRequiredProducts = productIdsPerInterval => {
		const intervals = Object.keys( productIdsPerInterval );
		return Object.keys( defaultProducts ).every( required => intervals.includes( required ) );
	};

	const mapStatusToState = result => {
		setShouldUpgrade( result.should_upgrade_to_access_memberships );
		setStripeConnectUrl( result.connect_url );

		if ( result.should_upgrade_to_access_memberships || result.connect_url ) {
			setProducts( defaultProducts );
			return;
		}

		const filteredProducts = filterProducts( result.products );

		if ( hasRequiredProducts( filteredProducts ) ) {
			setProducts( filteredProducts );
			return;
		}

		// Only create products if we have the correct plan and stripe connection.
		fetchDefaultProducts( currency ).then( defaultFetchedProducts => {
			return setProducts( filterProducts( defaultFetchedProducts ) );
		}, setLoadingError );
	};

	useEffect( () => {
		fetchStatus( 'donation' ).then( mapStatusToState, setLoadingError );
	}, [ currency ] );

	if ( loadingError ) {
		return <LoadingError className={ className } error={ loadingError } />;
	}

	return (
		<div className="wp-block-jetpack-donations">
			{ ! shouldUpgrade && stripeConnectUrl && (
				<StripeNudge
					blockName="donations"
					postId={ postId }
					stripeConnectUrl={ stripeConnectUrl }
				/>
			) }
			<div className="donations__container">
				{ ( annualDonation || monthlyDonation ) && (
					<div className="donations__nav">
						{ tabs.map(
							( { id, label }, index ) =>
								attributes[ id ] && (
									<DonationTabButton
										label={ label }
										id={ id }
										color={ computedBorderColor }
										tabIndex={ index }
										isActive={ activeTab === id }
										onActivateTab={ setActiveTab }
									/>
								)
						) }
					</div>
				) }
				<div className="donations__content ">
					<Context.Provider
						value={ { activeTab, fallbackLinkUrl, products, currency, showCustomAmount } }
					>
						<InnerBlocks
							allowedBlocks={ [ 'jetpack/donations-view' ] }
							templateLock={ 'all' }
							template={ [
								[ 'jetpack/donations-view', { type: ONE_TIME_DONATION } ],
								[ 'jetpack/donations-view', { type: MONTHLY_DONATION } ],
								[ 'jetpack/donations-view', { type: ANNUAL_DONATION } ],
							] }
							__experimentalCaptureToolbars={ true }
							templateInsertUpdatesSelection={ false }
						/>
					</Context.Provider>
				</div>
				<Controls { ...props } onChangeTab={ resetActiveTab } />
			</div>
		</div>
	);
};

export default Edit;
