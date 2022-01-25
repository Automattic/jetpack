/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import {
	ANNUAL_DONATION_TAB,
	DEFAULT_TAB,
	MONTHLY_DONATION_TAB,
	ONE_TIME_DONATION_TAB,
} from './common/constants';
import Context from './common/context';
import Controls from './controls';

const tabs = [
	{
		id: ONE_TIME_DONATION_TAB,
		label: __( 'One-Time', 'jetpack' ),
	},
	{
		id: MONTHLY_DONATION_TAB,
		label: __( 'Monthly', 'jetpack' ),
	},
	{
		id: ANNUAL_DONATION_TAB,
		label: __( 'Yearly', 'jetpack' ),
	},
];

const DonationTabButton = ( { label, id, tabIndex, isActive, onActivateTab } ) => {
	return (
		<div
			role="button"
			tabIndex={ tabIndex }
			className={ classNames( 'donations__nav-item', {
				'is-active': isActive,
			} ) }
			onClick={ () => onActivateTab( id ) }
			onKeyDown={ () => onActivateTab( id ) }
			key={ `jetpack-donations-nav-item-${ tabIndex }` }
		>
			{ label }
		</div>
	);
};

const Edit = props => {
	const { attributes } = props;
	const { annualDonation, monthlyDonation } = attributes;
	// Tab navigation state handling.
	const [ activeTab, setActiveTab ] = useState( DEFAULT_TAB );

	const resetActiveTab = ( controlTab, value ) => {
		if ( value === false && activeTab === controlTab ) {
			setActiveTab( DEFAULT_TAB );
		}
	};

	return (
		<div className="wp-block-jetpack-donations">
			<div className="donations__container">
				{ ( annualDonation || monthlyDonation ) && (
					<div className="donations__nav">
						{ tabs.map(
							( { id, label }, index ) =>
								attributes[ id ] && (
									<DonationTabButton
										label={ label }
										id={ id }
										tabIndex={ index }
										isActive={ activeTab === id }
										onActivateTab={ setActiveTab }
									/>
								)
						) }
					</div>
				) }
				<div className="donations__content">
					<Context.Provider value={ { activeTab } }>
						<InnerBlocks
							allowedBlocks={ [ 'jetpack/donations-view' ] }
							templateLock={ 'all' }
							template={ [
								[ 'jetpack/donations-view', { type: ONE_TIME_DONATION_TAB } ],
								[ 'jetpack/donations-view', { type: MONTHLY_DONATION_TAB } ],
								[ 'jetpack/donations-view', { type: ANNUAL_DONATION_TAB } ],
							] }
							__experimentalCaptureToolbars={ true }
							templateInsertUpdatesSelection={ false }
						/>
					</Context.Provider>
				</div>
				<Controls { ...props } onChange={ resetActiveTab } />
			</div>
		</div>
	);
};

export default Edit;
