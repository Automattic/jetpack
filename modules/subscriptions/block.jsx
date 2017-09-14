const { registerBlockType, InspectorControls, BlockDescription, source } = wp.blocks;
const { createElement } = wp.element;
const { text } = source;

const i18n = jpSubBlockI18n;

registerBlockType( 'jetpack/subscription-form', {
	title : i18n['Subscription Form'],
	icon : 'email-alt',
	category : 'common',
	attributes : {
		title : {
			type : 'string',
			source: text( '.subscription-form__title' ),
			default : 'Subscribe to this site'
		},
		subscribe_text : {
			type : 'string',
			source: text( '.subscription-form__text' ),
			default : i18n['Enter your email address to subscribe to this blog and receive notifications of new posts by email.']
		},
		subscribe_button : {
			type : 'string',
			default : i18n['Subscribe']
		},
		success_message : {
			type : 'string',
			default : i18n['Success! An email was just sent to confirm your subscription. Please find the email now and click \'Confirm Follow\' to start subscribing.']
		},
		show_subscribers_total : {
			type : 'bool',
			default : true
		}
	},

	edit : function( { attributes, setAttributes, focus } ) {
		function handleTitleChange( value ) {
			setAttributes({
				title : value
			});
		}
		function handleSubscribeTextChange( value ) {
			setAttributes({
				subscribe_text : value
			});
		}
		function handleSubscribeButtonChange( value ) {
			setAttributes({
				subscribe_button : value
			});
		}
		function handleSuccessMessageChange( value ) {
			setAttributes({
				success_message : value
			});
		}
		function handleShowSubscribersTotalChange( value ) {
			setAttributes({
				show_subscribers_change : !! value
			});
		}

		const {
			title,
			subscribe_text,
			show_subscribers_total,
			subscribe_button,
		} = attributes;

		return [
			<div key="subscription-form" className="subscription-form">
				{ !! title &&
					<h2 className="subscription-form__title">{ title }</h2>
				}
				<form>
					<fieldset disabled>
						{ !! subscribe_text &&
							<div id="subscribe-text" className="subscription-form__text">
								<p>{subscribe_text}</p>
							</div>
						}
						{ !! show_subscribers_total &&
							<p className="subscription-form__subscribers">
								{ i18n['Join %s other subscribers'].replace( '%s', '___' ) }
							</p>
						}
						<p id="subscribe-email">
							<label
								id="jetpack-subscribe-label"
								className="subscription-form__email-label"
							>
								{ i18n['Email Address'] }
							</label>
							<input
								type="email"
								className="required"
								placeholder={ i18n['Email Address'] }
								style={ { display: 'block' } }
								required
							/>
						</p>
						<p id="subscribe-submit">
							<input type="submit" value={ subscribe_button } />
						</p>
					</fieldset>
				</form>
			</div>,
			!! focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<h3>
							{ i18n['Subscription Form settings'] }
						</h3>
					</BlockDescription>
				</InspectorControls>

			)
		];
	},

	save : function( { attributes } ) {
		const {
			title,
			subscribe_text,
			show_subscribers_total,
			subscribe_button,
		} = attributes;

		return (
			<div className="subscription-form">
				{ !! title &&
				<h2 className="subscription-form__title">{ title }</h2>
				}
				<form>
					<fieldset disabled>
						{ !! subscribe_text &&
						<div id="subscribe-text" className="subscription-form__text">
							<p>{subscribe_text}</p>
						</div>
						}
						{ !! show_subscribers_total &&
						<p className="subscription-form__subscribers">
							{ i18n['Join %s other subscribers'].replace( '%s', '___' ) }
						</p>
						}
						<p id="subscribe-email">
							<label
								id="jetpack-subscribe-label"
								className="subscription-form__email-label"
							>
								{ i18n['Email Address'] }
							</label>
							<input
								type="email"
								className="required"
								placeholder={ i18n['Email Address'] }
								style={ { display: 'block' } }
								required
							/>
						</p>
						<p id="subscribe-submit">
							<input type="submit" value={ subscribe_button } />
						</p>
					</fieldset>
				</form>
			</div>
		);
	}

} );
