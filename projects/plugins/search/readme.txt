=== Jetpack Search ===
Contributors: automattic, annamcphee, bluefuton, kangzj, jsnmoon, robfelty, gibrown, trakos, dognose24, a8ck3n
Tags: search, filter, woocommerce search, ajax search, product search, free cloud-based search
Requires at least: 6.9
Requires PHP: 7.2
Tested up to: 7.0
Stable tag: 7.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Easily add cloud-powered instant search and filters to your website or WooCommerce store with advanced algorithms that boost your search results based on traffic to your site. Try it out for FREE!
== Description ==

Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.

Jetpack Search is an easy-to-use WordPress search plugin that enhances the default site search functionality provided by the CMS. Thanks to advanced site search tools, your visitors will experience the best search experience you can offer.

From real-time search filtering and faceting, to instant search results, Jetpack Search has all the features and options for best site search usability and results.

Note: Jetpack Search is free to use for sites with up to 5000 documents and 500 search requests per month. Beyond that, a Jetpack Search subscription, or a Jetpack plan subscription that includes Search is required to use this plugin.

**LESS DIGGING, MORE FINDING**

Do you have a WordPress site with thousands of posts, pages, and products? No problem. Thanks to a powerful search engine, Jetpack Search helps visitors find exactly what they’re looking for — fast.

**KEEP PEOPLE READING & BUYING**

Give your visitors instant search results and advanced filtering to help them find what they need and stay longer on your site.

People on eCommerce sites are 2x more likely to purchase something when they search.

**FINELY-TUNED SEARCH FOR YOUR SITE**

Jetpack Search is a completely customizable WordPress site search plugin, so your visitors get a search experience that blends in seamlessly with your site design.

**WHY CHOOSE JETPACK SEARCH?**

* Highly relevant search results organized by modern ranking algorithms
* Boosted and prioritized results based on your site’s search stats
* Instant search and filtering without reloading the page
* Site search filters and facets (by categories, tags, dates, custom taxonomies, and post types)
* Improved theme compatibility for both mobile and desktop
* Real-time indexing, so your search index is updated within minutes of changes to your site
* Integrates seamlessly with WooCommerce
* Support for all languages, and advanced language analysis for 38 languages
* Highlighted search terms on comments and post content
* Fast and accurate spelling correction

**WITH 💚 BY JETPACK**
This is just the start!

We are working hard to bring more features and improvements to Jetpack Search. Let us know your thoughts and ideas!

== Installation ==

There’s nothing to configure – the setup process is as easy as:
Install the plugin
Activate Jetpack Connection

Note: A Jetpack Search subscription, or a Jetpack plan subscription that includes Search is required to use this plugin. If you want to try it out for free, simply choose the free option during the subscription checkout process.

== Frequently Asked Questions ==

= Why do I need site search on WordPress? =

Site search enables visitors to quickly find what they are looking for from your site or eCommerce store, keeping them engaged for longer. People on eCommerce sites are 2x more likely to purchase something when they search.

= How do I enable Jetpack Search? =

Simply install the plugin and connect your site. If you already have a subscription that includes Jetpack Search it will work automatically, otherwise you can sign up for a subscription through the plugin.

= Is there a free version? =

YES! You can use Jetpack Search for free for sites up to 5000 records or 500 search requests per month. You will still need to sign up for a subscription; simply choose the free option.  You can sign up for a free Jetpack Search subscription directly through this plugin or via the [Jetpack website](https://jetpack.com/search/).

= What languages does Jetpack Search support? =

We provide support for all languages, and advanced language analysis for 38 languages.

= Does Jetpack Search support eCommerce stores and products? =

Yes, eCommerce stores and products work seamlessly with Jetpack Search, no additional configuration required.

= Is this plugin compatible with WooCommerce? =

Yes, Jetpack Search works seamlessly with WooCommerce product search.

= Can I customize how the search results look? =

Yes, Jetpack Search is completely customizable so your visitors get a search experience that blends in seamlessly with your site design.

= Does Jetpack Search work on mobile? =

Yes, Jetpack Search is optimized for site visitors from mobile devices.

= Will this plugin work with my theme? =

This plugin works seamlessly with any WordPress theme.

= Does Jetpack Search allow visitors to filter the search results? =

Yes, visitors can filter search results by tags, categories, dates, custom taxonomies, and post types.

= Where can I get a Jetpack Search subscription? =

You can purchase a Search subscription directly through this plugin or via the [Jetpack website](https://jetpack.com/search/).

= How do I get rid of the "Powered by Jetpack" message in the overlay? =

If you are using the Jetpack Search free option, you cannot disable the "Powered by Jetpack" message. You will need to upgrade to a paid plan.

= What happens if I go over the records or requests limit? =

If you are using the Jetpack Search free option, and you have more than 5000 records (posts, pages, etc. ) on your site, or more than 500 search requests per month, we will ask you to upgrade to a paid subscription at the appropriate tier at your next renewal period. If your usage is above the threshold for three months or more, we will disable the plan, and your site visitors will see the default WordPress search experience instead. Note that we base the number of requests on the median of the past three months, so an unusual spike in search traffic will not automatically force you into the next tier.

== Screenshots ==

1. Configuring and customizing Jetpack Search is a breeze.
2. Lots of customization options to make Search match your site design.
3. Clear, easy-to-read search results.
4. Easy to filter results and smart spelling mistake handling.
5. Manage all of your Jetpack products, including Search, in a single place.

== Changelog ==
### 7.0.0 - 2026-06-10
#### Added
- Search 7.0: build full search pages from native blocks — a Search Input block with search-as-you-type, Filters blocks (checkbox, date, custom taxonomy) with sidebar or collapsible-popover layouts, and Results blocks with selectable layouts, sorting, and load-more — all theme-aware on both block and classic themes.
- Search 7.0: new Embedded search experience — a full-page search rendered inline in the theme at a real, bookmarkable URL with search-as-you-type, filters, sort, and load-more on the same page.
- Search 7.0: new blocks-powered Overlay experience (Beta) — the same search blocks delivered in a modal that opens over the current page, keeping visitors in context.
- Search 7.0 for WooCommerce: product search support — Filter by Product Attribute, Price, Rating, and Stock Status blocks, a Product Filters container, Product Category/Tag/Brand checkbox variations, a product results layout (image, title, price, rating), and Price/Rating sort options.
- Search: add fallback image capability in expanded search
- Search: Adding auto-complete search query feature
- Search Blocks Overlay: render product results and product filters from a dedicated product overlay template on WooCommerce product searches.

#### Changed
- General: Update minimum WordPress version to 6.9.
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency.
- Remove unneeded development and documentation files from the published plugin.
- Search 7.0: result cards now honor the site's date_format option (F j, Y, Y-m-d, etc.) instead of a fixed Intl shape.
- Search Blocks: default the checkbox-filter Custom Taxonomy label to the taxonomy's display name instead of leaving it empty.
- Search Blocks: the product-search edit link now follows the active experience — "Edit the product Search overlay" for Overlay (blocks), "Edit the product search template" otherwise — and pairs with a Restore default that acts on the matching template. The product-search toggle and the Embedded experience are now marked Beta.
- Search Blocks: unify the three search-results templates' responsive layout under a shared `.jetpack-search-layout__*` class namespace, collapsing the duplicate sidebar-collapse rules from `block_template_overlay_inline_css()` and `search_page_inline_css()` into a single `search_layout_inline_css()` helper. Pure refactor — no behavior change.
- Search Blocks Overlay: collapse the filter sidebar below 992px and dock a `filters-popover` trigger next to Sort By, matching the legacy Instant Search overlay UX.
- Search Blocks Overlay: separate the modal card from the dim scrim on dark themes by tinting the resolved surface and painting a token-aware hairline border, so the card visibly layers above the page behind it.
- Tested up to WordPress 7.0.
- Update composer.lock files.
- Updated package dependencies.
- Update package dependencies.
- Update package dependencies.
- Update package dependencies.
- Update package dependencies.

#### Fixed
- Fix mobile overflow on the upsell/pricing page so cards no longer get clipped.

== Testimonials ==

“I like having a search experience that is sortable, filterable, and feels like it's integrated natively into the site. Jetpack Search does all of this, but most importantly, it returns great results without heavy configuration.” - Chris Coyier, Web Design Expert (codepen.io / ShopTalk Show)

“If people can get the answers they want quickly without having to email me, it’s pure gold and it makes my job easier. I’m advertising it in my client consultations and telling people to use it because it actually works.” - Kylie Mawdsley, Interior Design Consultant (Kylie M. Interiors)
