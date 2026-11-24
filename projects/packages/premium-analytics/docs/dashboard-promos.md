# Dashboard promos

How another package puts a promotional card in front of Premium Analytics readers without Premium Analytics depending on it. A promo is a registered record: a placement, optional copy, a call to action, an availability rule and a dismissal policy. Premium Analytics owns the frame, the dismiss control, the dismissal memory and the view and dismiss tracking. The registrant owns the offer.

Nothing renders until the `jetpack-stats-promos` feature flag is on. It is registered with `'default' => false`, which is the launch hold: a promo that is registered, available and well-formed still shows nowhere.

## Vocabulary

| Term      | Meaning                                                                                         | Example                          |
| --------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| Slug      | Namespaced identifier, `<namespace>/<name>`, matching `^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$`.     | `acme/offer`                     |
| Placement | Where the promo renders: `options-menu` or `settings`.                                          | `settings`                       |
| Tier      | Whether Premium Analytics draws the card from plain copy, or a script module draws its content. | plain copy, or a `render_module` |
| Snooze    | How long a first dismissal hides the promo, in days.                                            | `90`                             |

## Registering a promo

Hook `jetpack_premium_analytics_register_promos` and call `register_promo()` there. Do not hook `init`.

Write the action as the literal string, not as `Promo_Registry::REGISTER_ACTION`. Another plugin may put an older copy of this package ahead of yours in the autoloader, and reading a constant off a class that copy does not have is a fatal error at `add_action()` time, before any version check inside your callback can run.

The registry fires the action once, on its first read after `init`, whichever request makes that read: the dashboard page, or a REST request that runs later than `init`. A registrant hooked on `init` reaches one path and misses the other. A read before `init` is a `_doing_it_wrong()` and does not latch, so a registrant hooked later still runs on the first read after `init`.

The action only fires from code that has loaded this package, so a callback on it needs no `function_exists()` guard. A registrant that may run twice guards with `$registry->is_registered( $slug )`.

```php
use function Automattic\Jetpack\PremiumAnalytics\register_promo;

add_action(
	'jetpack_premium_analytics_register_promos',
	static function () {
		register_promo(
			'acme/offer',
			array(
				'placement'    => 'settings',
				'title'        => __( 'Grow with Acme', 'acme' ),
				'description'  => __( 'Reach more readers with Acme.', 'acme' ),
				'cta_label'    => __( 'Try Acme', 'acme' ),
				'cta_url'      => 'https://example.com/acme',
				'is_available' => static function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}
);
```

`is_available` is required in practice: **a promo that declares no rule is never available.** This differs from a dashboard section, which is visible by default. A promo is an interruption, so the registrant has to say who it is for.

### Arguments

| Key             | Default        | Meaning                                                                                     |
| --------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `placement`     | none, required | `options-menu` or `settings`.                                                               |
| `order`         | `10`           | Lower shows first. Ties break on the slug.                                                  |
| `title`         | `''`           | The card heading, which also labels the card for assistive technology. A card requires one. |
| `description`   | `''`           | The card body.                                                                              |
| `cta_label`     | `''`           | The call to action text, and the whole menu item for `options-menu`, which requires one.    |
| `cta_url`       | `''`           | The call to action link. Only `http` and `https` links render.                              |
| `dismissible`   | `true`         | Whether the card has a close control.                                                       |
| `snooze_days`   | `90`           | Days a first dismissal lasts. `0` makes the first dismissal final.                          |
| `render_module` | `null`         | The id of a script module that draws the card content. See [The two tiers](#the-two-tiers). |
| `is_available`  | none           | A boolean, or a callable that receives the promo. Without it the promo is never available.  |

### What `register()` refuses

Each refusal is a `_doing_it_wrong()` and a `false` return, and nothing is registered.

- A slug that does not match the pattern above, or one that is already registered.
- A `placement` that is not one of the two.
- A card with no `title`. The title labels the card, and a landmark with no name is unusable with a screen reader. This holds for a promo with a `render_module` too, whose registered copy is what shows until the module loads.
- An `is_available` that is neither a boolean nor callable. A misspelled function name is truthy, so the promo would show to everyone.
- An `options-menu` promo with no `cta_label`. The label is the menu item, and an item with no text is a focusable link with no name.
- An `options-menu` promo that is `dismissible`. A menu item has no close control, so pass `'dismissible' => false`.
- An `options-menu` promo with a `render_module`. A menu item is not a card.
- A negative `snooze_days`.
- `snooze_days` on a promo that is not `dismissible`. A promo that cannot be dismissed has nothing to snooze.
- A `render_module` that is not a non-empty string.

## Who sees a promo

`get_available_promos()` applies four gates, in order:

1. The `jetpack-stats-promos` feature flag.
2. The `jetpack_show_promotions` filter, which is `true` by default. A host returns `false` to turn every promotion off.
3. The promo's own `is_available()`.
4. The `jetpack_premium_analytics_promos` filter, which receives the surviving promos as `$slug => $promo` pairs and may drop some. A promo this filter adds reaches the client having passed none of the rules `register_promo()` enforces, so it can hold a placement or a combination the registry would have refused. Only the `Promo` type is checked.

The gates run once per request: the dashboard's script data and its import map both ask, so a rule that answers them separately would run twice.

It then sorts by `order`, then `slug`, and publishes the list to the client as `premium_analytics.promos` in the script data. A promo with a `render_module` also adds that module to the page import map, as a dynamic dependency.

### The feature flag

The flag is the launch hold, and it is the only reason a registered promo can stay invisible after every other gate says yes. Turn it on for local testing with a filter:

```php
add_filter( 'jetpack_feature_flag_enabled_jetpack-stats-promos', '__return_true' );
```

On a Jurassic Ninja site, use `wp companion feature-flag enable jetpack-stats-promos` instead. The fixture filter below still needs a mu-plugin or a code snippet, since a `wp companion` command cannot add a filter.

## The two placements

| Placement      | Renders                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `settings`     | A card in the settings panel.                                                                                    |
| `options-menu` | One item in the Stats options menu. It behaves as a link: `cta_label` is its text and `cta_url` its destination. |

A third placement, a card at the foot of a dashboard section, is not in this version. It arrives with a `target` argument and a minor version of its own.

The `options-menu` placement is not on every page. Its menu item does not appear on the connect page, on the locked report page or on the upgrade page, because each of those carries Premium Analytics' own upsell and a promo would sit beside it. It does appear on the dashboard and on the Settings page. Registering the same offer in more than one placement is the registrant's choice.

## The two tiers

**Plain copy.** With no `render_module`, Premium Analytics draws the card from `title`, `description` and the call to action. A registrant with plain copy needs no JavaScript.

**A render module.** With a `render_module`, the module owns the entire content region of the card. Premium Analytics still draws the frame, the close control, and the view and dismiss tracking. The module is a script module with a default export, a React component that receives `PromoRenderProps` from `@automattic/jetpack-premium-analytics-sdk`:

| Prop         | Meaning                                                                               |
| ------------ | ------------------------------------------------------------------------------------- |
| `promo`      | The promo record, as registered.                                                      |
| `onDismiss`  | Present when the promo is dismissible. Calls the same dismissal as the close control. |
| `trackClick` | `trackClick( label )` records a click. The label tells the module's own links apart.  |

**Click tracking belongs to the module.** Premium Analytics cannot see a click inside content it does not draw, so a module calls `trackClick()` from each link or button. `PromoCta` from the same SDK is a link that already does. Until the module loads, and if it fails to load, the card shows the plain-copy content, so keep `title`, `description`, `cta_label` and `cta_url` filled in on a promo that has a module.

Register the module with `wp_register_script_module()` under the id passed as `render_module`, in the same callback. The registry adds it to the page import map. Declare the SDK as a module dependency: the page's import map resolves `@automattic/jetpack-premium-analytics-sdk` to the dashboard's own exports, which is how a module reaches `PromoCta` without bundling it.

```php
add_action(
	'jetpack_premium_analytics_register_promos',
	static function () {
		wp_register_script_module(
			'acme/offer-card',
			plugins_url( 'build/offer-card.js', __FILE__ ),
			array( '@automattic/jetpack-premium-analytics-sdk' ),
			'1.0.0'
		);

		register_promo(
			'acme/offer',
			array(
				'placement'     => 'settings',
				'title'         => __( 'Grow with Acme', 'acme' ),
				'description'   => __( 'Reach more readers with Acme.', 'acme' ),
				'cta_label'     => __( 'Try Acme', 'acme' ),
				'cta_url'       => 'https://example.com/acme',
				'render_module' => 'acme/offer-card',
				'is_available'  => true,
			)
		);
	}
);
```

```tsx
import { PromoCta, type PromoRenderProps } from '@automattic/jetpack-premium-analytics-sdk';

export default function OfferCard( { promo, trackClick }: PromoRenderProps ) {
	return (
		<div>
			<h3>{ promo.title }</h3>
			<p>{ promo.description }</p>
			<PromoCta href={ promo.cta_url } label={ promo.cta_label } trackClick={ trackClick } />
		</div>
	);
}
```

React is not a module specifier here. The dashboard page loads it as the classic script handles `react` and `react-jsx-runtime`, and a wp-build module reads it from `window.React` and `window.ReactJSXRuntime`, so build the module with wp-build and leave React external. A module that cannot find `window.React` fails to load, and the card shows the plain-copy fallback.

An `options-menu` promo is a link, so it carries no module and cannot be dismissed:

```php
register_promo(
	'acme/menu-offer',
	array(
		'placement'    => 'options-menu',
		'cta_label'    => __( 'Try Acme', 'acme' ),
		'cta_url'      => 'https://example.com/acme',
		'dismissible'  => false,
		'is_available' => true,
	)
);
```

## Dismissal

One promo shows per placement at a time, the first by `order` that the reader has not dismissed. Closing one empties that placement for the rest of the page load. The next promo does not take its place until the next load, so a card never swaps under the reader's cursor.

The first close snoozes the promo for `snooze_days`. The second close is final, as is a first close on a promo with `snooze_days` of `0`.

Records live in the `core/preferences` scope `jetpack-premium-analytics/dashboard`, under the key `dismissedPromos`: an object keyed by slug, each value holding a close `count` and the time `at` of the latest. That is local to this dashboard. A promotion surface elsewhere that offers the same product does not read it, so a reader who closed a promo here can see the offer again there.

## Tracking

Premium Analytics records three events, each with the `slug` and the `placement`:

| Event                                     | When                                                                                                                              | Extra properties                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `jetpack_premium_analytics_promo_view`    | A card first shows, once per placement per page load. For an `options-menu` promo, each time the menu opens with the promo in it. |                                  |
| `jetpack_premium_analytics_promo_click`   | The reader follows the call to action, or the options menu item.                                                                  | `label`                          |
| `jetpack_premium_analytics_promo_dismiss` | The reader closes a card.                                                                                                         | `dismissal`: `snooze` or `final` |

For a card with a render module, the click event is the module's to send through `trackClick()`.

## Versioning the contract

`PROMO_API_VERSION` (`Automattic\Jetpack\PremiumAnalytics\PROMO_API_VERSION`) names the contract a registrant is built against: the arguments `register_promo()` takes and what each means, the placements, the `Promo` fields a render module reads, and `PromoRenderProps`, `PromoRecord` and `PromoCta` from `@automattic/jetpack-premium-analytics-sdk`.

The major changes when a registrant built against the previous contract stops working: an argument or placement removed, or a changed meaning. The minor changes when a registrant can rely on something new: a new argument, placement or SDK export. A registrant compares the version in its callback. It skips registration when the major differs, and when the minor is below the one it needs.

| Version | Contract                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------ |
| 1.0.0   | The arguments and placements above, and the SDK's `PromoRenderProps`, `PromoRecord` and `PromoCta`. |

```php
add_action(
	'jetpack_premium_analytics_register_promos',
	static function () {
		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\PROMO_API_VERSION' ) ) {
			return;
		}
		$version = \Automattic\Jetpack\PremiumAnalytics\PROMO_API_VERSION;
		if ( version_compare( $version, '1.0.0', '<' ) || version_compare( $version, '2', '>=' ) ) {
			return;
		}

		register_promo( 'acme/offer', array( /* ... */ ) );
	}
);
```

## Trying it locally

`src/promo-fixture.php` registers one promo per placement: a menu item, and a settings card drawn by a render module. It registers only when two things are on, so turning the feature flag on alone shows nothing.

1. Force the feature flag on, as above.
2. Force the fixtures on:

```php
add_filter( 'jetpack_premium_analytics_register_promo_fixtures', '__return_true' );
```

3. Open the dashboard. The Stats options menu has a Fixture menu item.
4. Open Settings. The card there is the render module tier.

Add a case to the fixture whenever a placement is added: `Promo_Fixture_Test` fails until every placement has one.

