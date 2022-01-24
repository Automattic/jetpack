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
import DonationsContext from './common/donations-context';

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

const Edit = () => {
	// Tab navigation state handling.
	const [ activeTab, setActiveTab ] = useState( DEFAULT_TAB );

	return (
		<div className="wp-block-jetpack-donations">
			<div className="donations__container">
				<div className="donations__nav">
					{ tabs.map( ( { id, label }, index ) => (
						<DonationTabButton
							label={ label }
							id={ id }
							tabIndex={ index }
							isActive={ activeTab === id }
							onActivateTab={ setActiveTab }
						/>
					) ) }
				</div>
				<div className="donations__content">
					<DonationsContext.Provider value={ { activeTab } }>
						<InnerBlocks
							allowedBlocks={ [
								'jetpack/donations-one-time-view',
								'jetpack/donations-monthly-view',
								'jetpack/donations-annual-view',
							] }
							templateLock={ 'all' }
							template={ [
								[ 'jetpack/donations-one-time-view', { activeTab } ],
								[ 'jetpack/donations-monthly-view', { activeTab } ],
								[ 'jetpack/donations-annual-view', { activeTab } ],
							] }
							__experimentalCaptureToolbars={ true }
							templateInsertUpdatesSelection={ false }
						/>
					</DonationsContext.Provider>
				</div>
			</div>
		</div>
	);
};

export default Edit;
