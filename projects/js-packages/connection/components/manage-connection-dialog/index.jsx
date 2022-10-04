import { Button, getRedirectUrl, H2 } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
//import './style.scss';

/**
 * The RNA Manage Connection Dialog component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ManageConnectionDialog` component.
 */
const ManageConnectionDialog = props => {
	const { title, isOpen } = props;

	return (
		<>
			{ isOpen && (
				<Modal
					title={ title }
					contentLabel={ title }
					aria={ {
						labelledby: 'jp-connection__manage-dialog__heading',
					} }
					shouldCloseOnClickOutside={ false }
					shouldCloseOnEsc={ false }
					isDismissible={ false }
					className={ 'jp-connection__manage-dialog' }
				>
					<H2>
						{ __(
							'At least one user must be connected for your Jetpack products to work properly.',
							'jetpack'
						) }
					</H2>
					<Button variant="primary" isExternalLink={ true } fullWidth={ true }>
						{ __( 'Transfer ownership to another admin', 'jetpack' ) }
					</Button>
					<Button
						variant="primary"
						isExternalLink={ true }
						fullWidth={ true }
						isDestructive={ true }
					>
						{ __( 'Disconnect Jetpack', 'jetpack' ) }
					</Button>
					<HelpFooter />
				</Modal>
			) }
		</>
	);
};

const HelpFooter = () => {
	return (
		<div className="jp-connection__disconnect-dialog__actions">
			<div className="jp-row">
				<div className="lg-col-span-7 md-col-span-8 sm-col-span-4">
					<p>
						{ createInterpolateElement(
							__(
								'<strong>Need help?</strong> Learn more about the <jpConnectionInfoLink>Jetpack connection</jpConnectionInfoLink> or <jpSupportLink>contact Jetpack support</jpSupportLink>.',
								'jetpack'
							),
							{
								strong: <strong></strong>,
								jpConnectionInfoLink: (
									<a
										href={ getRedirectUrl(
											'why-the-wordpress-com-connection-is-important-for-jetpack'
										) }
										rel="noopener noreferrer"
										target="_blank"
										className="jp-connection__disconnect-dialog__link"
										// TODO add click track
									/>
								),
								jpSupportLink: (
									<a
										href={ getRedirectUrl( 'jetpack-support' ) }
										rel="noopener noreferrer"
										target="_blank"
										className="jp-connection__disconnect-dialog__link"
										// TODO add click track
									/>
								),
							}
						) }
					</p>
				</div>
				<div className="jp-connection__disconnect-dialog__button-wrap lg-col-span-5 md-col-span-8 sm-col-span-4">
					<Button
						variant="primary"
						className="jp-connection__disconnect-dialog__btn-dismiss"
						//TODO add cancel function
					>
						{ __( 'Cancel', 'jetpack' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};
ManageConnectionDialog.propTypes = {
	/** The modal title. */
	title: PropTypes.string,
	/** Whether or not the dialog modal should be open. */
	isOpen: PropTypes.bool,
};

ManageConnectionDialog.defaultProps = {
	title: __( 'Are you sure you want to disconnect?', 'jetpack' ),
	isOpen: false,
};

export default ManageConnectionDialog;
