// Runs before DOM ready, so core's theme.js finds the tab when it routes `?browse=wpcom`.
( () => {
	const config = window.wpcomThemesTab;
	if ( ! config ) {
		return;
	}

	const list = document.querySelector( '.wp-filter .filter-links' );
	if ( list ) {
		const link = document.createElement( 'a' );
		link.href = '#';
		link.dataset.sort = config.sort;
		link.textContent = config.label;

		const item = document.createElement( 'li' );
		item.appendChild( link );
		list.prepend( item );
	}

	const views = window.wp && window.wp.themes && window.wp.themes.view;
	if ( ! views ) {
		return;
	}

	/**
	 * What a theme has to be bought with, if anything, before it can be installed.
	 *
	 * @param {object} theme - The theme being rendered.
	 * @return {?object} Where to send the reader and what to call it, or null to leave core's button.
	 */
	const purchaseFor = theme => {
		if ( theme.upgrade_url ) {
			return { url: theme.upgrade_url, text: config.upgrade, label: config.upgradeLabel };
		}

		if ( theme.purchase_url ) {
			return { url: theme.purchase_url, text: config.subscribe, label: config.subscribeLabel };
		}

		return null;
	};

	/**
	 * Offers that purchase in place of the install core would otherwise run.
	 *
	 * The button is replaced rather than relabelled: core installs on a click anywhere in
	 * `.theme-install`, and this theme is not one the site may install yet.
	 *
	 * @param {Element} button   - Core's install or activate button.
	 * @param {object}  theme    - The theme being rendered.
	 * @param {object}  purchase - Where to send the reader and what to call it.
	 * @return {void}
	 */
	const offerPurchase = ( button, theme, purchase ) => {
		const link = document.createElement( 'a' );
		link.className = button.classList.contains( 'button-compact' )
			? 'button button-primary button-compact'
			: 'button button-primary';
		link.href = purchase.url;
		link.textContent = purchase.text;
		// Core labels its own buttons per theme, which a grid of them needs.
		if ( purchase.label ) {
			link.setAttribute( 'aria-label', purchase.label.replace( '%s', theme.name ) );
		}
		button.replaceWith( link );
	};

	let catalog;

	/**
	 * What the store charges this reader, which is priced where the request comes from.
	 *
	 * @return {Promise<object>} Products by slug, or an empty set if the store cannot be read.
	 */
	const products = () => {
		catalog =
			catalog ||
			fetch( config.products )
				.then( response => ( response.ok ? response.json() : {} ) )
				.catch( () => ( {} ) );

		return catalog;
	};

	/**
	 * Says what a partner theme costs, once the store has answered.
	 *
	 * @param {Element} badge - The badge to fill in.
	 * @param {object}  theme - The theme being rendered.
	 * @return {void}
	 */
	const showPrice = ( badge, theme ) => {
		products().then( catalogue => {
			const price = catalogue[ theme.price_product ]?.cost_per_month_display;
			if ( ! price ) {
				return;
			}

			badge.textContent = theme.price_plan
				? config.priceWithPlan.replace( '%1$s', price ).replace( '%2$s', theme.price_plan )
				: config.price.replace( '%s', price );
			badge.hidden = false;
		} );
	};

	/**
	 * Names the plan a theme needs, so the upgrade says what it buys.
	 *
	 * @param {object} theme    - The theme being rendered.
	 * @param {string} modifier - Extra class for where the badge is going.
	 * @return {Element} The badge.
	 */
	const planBadge = ( theme, modifier ) => {
		const badge = document.createElement( 'span' );
		badge.className = modifier ? `wpcom-themes-tab__plan ${ modifier }` : 'wpcom-themes-tab__plan';

		if ( theme.price_product ) {
			// Nothing to say until the store answers, and nothing at all if it does not.
			badge.hidden = true;
			showPrice( badge, theme );
		} else {
			badge.textContent = theme.plan_badge;
		}

		return badge;
	};

	/**
	 * Patches a rendered theme with what its plan costs this site.
	 *
	 * @param {Element}  el    - The view's element.
	 * @param {object}   theme - The theme being rendered.
	 * @param {Function} badge - Places the plan badge for this view.
	 * @return {void}
	 */
	const showPlan = ( el, theme, badge ) => {
		if ( ! el || ! theme || ( ! theme.plan_badge && ! theme.price_product ) ) {
			return;
		}

		// Only a theme the site cannot install yet needs its install taken away.
		const purchase = purchaseFor( theme );
		if ( purchase ) {
			const button = el.querySelector( '.theme-install, .activate' );
			if ( button ) {
				offerPurchase( button, theme, purchase );
			}
		}

		badge( el, theme );
	};

	/**
	 * Decorates what a core view renders, leaving its own markup to core.
	 *
	 * @param {object}   view     - A Backbone view class from core's theme.js.
	 * @param {Function} decorate - Runs against the rendered element.
	 * @return {void}
	 */
	const afterRender = ( view, decorate ) => {
		const render = view.prototype.render;
		view.prototype.render = function () {
			const result = render.apply( this, arguments );
			// A throw here would take the whole grid with it, so a view without a model is left alone.
			if ( this.model ) {
				decorate( this.el, this.model.toJSON() );
			}
			return result;
		};
	};

	// On a card the badge sits over the screenshot; in the preview it follows the author line.
	afterRender( views.Theme, ( el, theme ) =>
		showPlan( el, theme, () => {
			const screenshot = el.querySelector( '.theme-screenshot' );
			if ( screenshot ) {
				screenshot.appendChild( planBadge( theme, 'wpcom-themes-tab__plan--on-screenshot' ) );
			}
		} )
	);

	if ( views.Preview ) {
		afterRender( views.Preview, ( el, theme ) =>
			showPlan( el, theme, () => {
				const author = el.querySelector( '.theme-by' );
				if ( author ) {
					author.insertAdjacentElement( 'afterend', planBadge( theme ) );
				}
			} )
		);
	}
} )();
