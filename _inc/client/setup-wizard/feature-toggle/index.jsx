/**
 * External dependencies
 */
// import { Disabled, FormToggle } from '@wordpress/components';
import classnames from 'classnames';
import { translate as __ } from 'i18n-calypso';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Gridicon from 'components/gridicon';

import {
	mapStateToFeatureToggleProps,
	mapDispatchToFeatureToggleProps,
} from './map-feature-to-props';

import './style.scss';

let FeatureToggle = props => {
	const {
		title,
		details,
		info,
		checked,
		configureLink,
		upgradeLink,
		optionsLink,
		isPaid = false,
		isLinkExternal = false,
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
		}
	}, [ checked, props.onToggleChange ] );

	let buttonContent;
	if ( ! checked && upgradeLink ) {
		buttonContent = (
			<Button href={ upgradeLink } primary target={ isLinkExternal ? '_blank' : '' }>
				{ __( 'Upgrade now' ) }
				{ isLinkExternal && (
					<span>
						<Gridicon icon="external" />
					</span>
				) }
			</Button>
		);
	} else if ( configureLink ) {
		buttonContent = (
			<Button href={ configureLink } target={ isLinkExternal ? '_blank' : '' }>
				{ __( 'Configure' ) }
				{ isLinkExternal && (
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
		optionsLinkElement = (
			<a
				href={ optionsLink }
				target="_blank"
				rel="noopener noreferrer"
				className="jp-setup-wizard-view-options-link"
			>
				{ __( 'View options' ) }
			</a>
		);
	}

	// const formToggle = <FormToggle checked={ checked } onChange={ onToggleChange } />;
	const formToggle = null;

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
				{ /* { isDisabled ? <Disabled>{ formToggle }</Disabled> : formToggle } */ }
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
	isLinkExternal: PropTypes.bool,
};

FeatureToggle = connect(
	( state, ownProps ) => mapStateToFeatureToggleProps( state, ownProps.feature ),
	( dispatch, ownProps ) => mapDispatchToFeatureToggleProps( dispatch, ownProps.feature )
)( FeatureToggle );

export { FeatureToggle };
