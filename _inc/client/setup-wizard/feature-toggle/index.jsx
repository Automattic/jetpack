/**
 * External dependencies
 */
import { Disabled, FormToggle } from '@wordpress/components';
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';

import {
	mapStateToFeatureToggleProps,
	mapDispatchToFeatureToggleProps,
} from './map-feature-to-props';

import './style.scss';

let FeatureToggle = props => {
	const {
		feature,
		title,
		details,
		info,
		checked,
		configureLink,
		upgradeLink,
		optionsLink,
		isPaid = false,
		isButtonLinkExternal = false,
		isOptionsLinkExternal = false,
	} = props;

	const [ windowWidth, setWindowWidth ] = useState( false );

	const handleResize = useCallback( () => {
		setWindowWidth( window.innerWidth <= 660 ? 'small' : 'large' );
	}, [ window.innerWidth ] );

	useEffect( () => {
		handleResize(); // Call this once to make sure windowWidth is initialized
		window.addEventListener( 'resize', handleResize );
		return () => {
			window.removeEventListener( 'resize', handleResize );
		};
	} );

	const onToggleChange = useCallback( () => {
		if ( 'function' === typeof props.onToggleChange ) {
			props.onToggleChange( checked );
			analytics.tracks.recordEvent( 'jetpack_wizard_feature_toggled', {
				feature,
				new_value: ! checked,
			} );
		}
	}, [ checked, props.onToggleChange ] );

	const onUpgradeButtonClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_wizard_feature_upgrade', {
			feature,
		} );
	}, [ feature ] );

	const onConfigureButtonClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_wizard_feature_configure', {
			feature,
		} );
	}, [ feature ] );

	const onViewOptionsClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_wizard_feature_view_options', {
			feature,
		} );
	}, [ feature ] );

	let buttonContent;
	if ( ! checked && upgradeLink ) {
		buttonContent = (
			<Button
				href={ upgradeLink }
				primary
				target={ isButtonLinkExternal ? '_blank' : '' }
				onClick={ onUpgradeButtonClick }
			>
				{ __( 'Upgrade now', 'jetpack' ) }
				{ isButtonLinkExternal && (
					<span>
						<Gridicon icon="external" />
					</span>
				) }
			</Button>
		);
	} else if ( configureLink ) {
		buttonContent = (
			<Button
				href={ configureLink }
				target={ isButtonLinkExternal ? '_blank' : '' }
				onClick={ onConfigureButtonClick }
			>
				{ __( 'Configure', 'jetpack' ) }
				{ isButtonLinkExternal && (
					<span>
						<Gridicon icon="external" />
					</span>
				) }
			</Button>
		);
	}

	const largeWindow = 'large' === windowWidth;
	const smallWindow = 'small' === windowWidth;

	let infoContent;
	if ( info ) {
		infoContent = <p className="jp-setup-wizard-feature-toggle-info">{ info }</p>;
	}

	let optionsLinkElement;
	if ( optionsLink ) {
		const externalLinkProps = isOptionsLinkExternal
			? { target: '_blank', rel: 'noopener noreferrer' }
			: {};

		optionsLinkElement = (
			<a
				href={ optionsLink }
				className="jp-setup-wizard-view-options-link"
				{ ...externalLinkProps }
				onClick={ onViewOptionsClick }
			>
				{ __( 'View options', 'jetpack' ) }
				{ isOptionsLinkExternal && <Gridicon icon="external" size="18" /> }
			</a>
		);
	}

	const formToggle = <FormToggle checked={ checked } onChange={ onToggleChange } />;

	const isDisabled = !! ( props.isDisabled || upgradeLink );

	return (
		<div
			className={ classnames( 'jp-setup-wizard-feature-toggle', {
				'jp-setup-wizard-fixed-right-column': largeWindow && ( buttonContent || infoContent ),
			} ) }
		>
			<div
				className={ classnames( 'jp-setup-wizard-form-toggle-container', {
					'is-paid-feature': isPaid,
				} ) }
			>
				<Gridicon icon="star" />
				{ isDisabled ? <Disabled>{ formToggle }</Disabled> : formToggle }
			</div>
			{ smallWindow && (
				<div className="jp-setup-wizard-form-toggle-title-small">
					<p>{ title }</p>
				</div>
			) }
			<div className="jp-setup-wizard-feature-toggle-content-container">
				<p className="jp-setup-wizard-feature-toggle-content">
					{ largeWindow && <span>{ title }</span> }
					{ details }
					{ optionsLinkElement && <span>{ optionsLinkElement }</span> }
				</p>
			</div>
			{ ( buttonContent || infoContent ) && (
				<div className="jp-setup-wizard-feature-toggle-button-container">
					{ buttonContent }
					{ infoContent }
				</div>
			) }
		</div>
	);
};

FeatureToggle.propTypes = {
	feature: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
	info: PropTypes.string,
	checked: PropTypes.bool.isRequired,
	onToggleChange: PropTypes.func,
	configureLink: PropTypes.string,
	upgradeLink: PropTypes.string,
	optionsLink: PropTypes.string,
	isPaid: PropTypes.bool,
	isDisabled: PropTypes.bool,
	isButtonLinkExternal: PropTypes.bool,
	isOptionsLinkExternal: PropTypes.bool,
};

FeatureToggle = connect(
	( state, ownProps ) => mapStateToFeatureToggleProps( state, ownProps.feature ),
	( dispatch, ownProps ) => mapDispatchToFeatureToggleProps( dispatch, ownProps.feature )
)( FeatureToggle );

export { FeatureToggle };
