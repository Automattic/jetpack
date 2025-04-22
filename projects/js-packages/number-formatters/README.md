# Number Formatters

A collection of utilities for formatting numbers in JavaScript/TypeScript applications.

## Usage

Internally, the package calls a formatter closure/factory that returns methods for formatting numbers (plain), currencies, compact numbers, etc. The closure handles locale state.

```typescript
import { setLocale, formatNumber } from '@automattic/number-formatters';

setLocale( 'de' ); // See notes below about locale state
formatNumber( 1000 ); // Returns "1.000"

setLocale( 'en' );
formatNumber( 1000 ); // Returns "1,000"
```

In a future version, we may expose the internal methods/formatters that accept a `locale` parameter instead. See `Dev/Setup` notes below.

### Notes: On locale state / `setLocale`

The package exports a `setLocale` method (see "Methods" below), which allows for setting the locale variable used for localising the numbers. There is a fallback chain for a default value, which may suffice for many cases (hence not needing to set this manually in the code through `setLocale`).
The fallback locale is defined as either/or:

1. the current WordPress user locale, if available through `@wordpress/date` settings (assuming this runs in a WordPress context). Note that this is derived from **user settings**, not the site's.
2. the browser's locale, if available through `window.navigator.language`
3. an internal fallback locale constant (`en` - may be switched to `en-US`)

If the locale is set through a call to `setLocale`, then that will obviously take precedence.

## Methods

For the various TS types mentioned below, see our [type definitions](./src/types.ts).

### createNumberFormatters()

```typescript
createNumberFormatters(): NumberFormatters
```

The main factory method that returns an instance/object with all of the methods mentioned below. For the most part, calling this wouldn't be necessary as the package already creates a default formatter. It would be useful for cases where consumer needs more control i.e. multiple instances of the formatter for separate locale state handling.

### formatNumber()

```typescript
formatNumber(
	number: number,
	options?: Omit< NumberFormatParams, 'browserSafeLocale' >
): string;

```

The `formatNumber` method is used for formatting numbers using the loaded locale settings (i.e., locale-specific thousands and decimal separators). You pass in the number (integer or float) and (optionally) the number of decimal places you want (or an options object), and a string is returned with the proper formatting for the currently-loaded locale. You can also override the locale settings for a particular number if necessary by expanding the second argument into an object with the attributes you want to override.

#### Examples

```typescript
// These examples assume a 'de' (German) locale to demonstrate
formatNumber( 2500.25 ); // '2.500'
formatNumber( 2500.33, { decimals: 3 } ); // '2.500,330'
```

### formatNumberCompact()

`formatNumberCompact` will format and localise a number using compact notation with 1 decimal point e.g. 1K, 1.5M, etc. It works identical to `formatNumber` (same number and order of arguments).

### formatCurrency()

```typescript
formatCurrency(
    number: number,
    currency: string,
    options: FormatCurrencyOptions = {}
): string
```

Formats money with a given currency code.

The currency will define the properties to use for this formatting, but those properties can be overridden using the options. Be careful when doing this.

For currencies that include decimals, this will always return the amount with decimals included, even if those decimals are zeros. To exclude the zeros, use the `stripZeros` option. For example, the function will normally format `10.00` in `USD` as `$10.00` but when this option is true, it will return `$10` instead.

Since rounding errors are common in floating point math, sometimes a price is provided as an integer in the smallest unit of a currency (eg: cents in USD or yen in JPY). Set the `isSmallestUnit` to change the function to operate on integer numbers instead. If this option is not set or false, the function will format the amount `1025` in `USD` as `$1,025.00`, but when the option is true, it will return `$10.25` instead.

#### Notes

- We always show `US$` for USD when the user's geolocation is not inside the US. This is important because other currencies use `$` for their currency and are surprised sometimes if they are actually charged in USD (which is the default for many users). We can't safely display `US$` for everyone because we've found that US users are confused by that style and it decreases confidence in the product.
- An option to format currency from the currency's smallest unit (eg: cents in USD, yen in JPY). This is important because doing price math with floating point numbers in code produces unexpected rounding errors, so most currency amounts should be provided and manipulated as integers.

### getCurrencyObject()

This is an optional API to return the formatted pieces of a price separately, so the consumer can decide how best to render them (eg: this is used to wrap different HTML tags around prices and currency symbols). JS already includes this feature as `Intl.NumberFormat.formatToParts()` but our API must also include the other features listed here and extra information like the position of the currency symbol (before or after the number).

```typescript
getCurrencyObject(
    number: number,
    currency: string,
    options: FormatCurrencyOptions = {}
): CurrencyObject
```

Returns a formatted price object. See below for the details of that object's properties.

The currency will define the properties to use for this formatting, but those properties can be overridden using the options. Be careful when doing this.

For currencies that include decimals, this will always return the amount with decimals included, even if those decimals are zeros. To exclude the zeros, use the `stripZeros` option. For example, the function will normally format `10.00` in `USD` as `$10.00` but when this option is true, it will return `$10` instead. Alternatively, you can use the `hasNonZeroFraction` return value to decide if the decimal section should be displayed.

Since rounding errors are common in floating point math, sometimes a price is provided as an integer in the smallest unit of a currency (eg: cents in USD or yen in JPY). Set the `isSmallestUnit` to change the function to operate on integer numbers instead. If this option is not set or false, the function will format the amount `1025` in `USD` as `$1,025.00`, but when the option is true, it will return `$10.25` instead.

### setLocale()

```typescript
setLocale( locale: string ): void
```

A function that can be used to set a default locale for use by the various formatters.

### setGeoLocation()

```typescript
setGeoLocation( geoLocation: string ): void
```

By default, the currency symbol for USD will be based on the locale (unlike other currency codes which use a hard-coded list of overrides); for `en-US`/`en` it will be `$` and for all other locales it will be `US$`. However, if the geolocation determines that the country is not inside the US, the USD symbol will be `US$` regardless of locale. This is to prevent confusion for users in non-US countries using an English locale.

In the US, users will expect to see USD prices rendered with the currency symbol `$`. However, there are many other currencies which use `$` as their currency symbol (eg: `CAD`). This package tries to prevent confusion between these symbols by using an international version of the symbol when the locale does not match the currency. So if your locale is `en-CA`, USD prices will be rendered with the symbol `US$`.

However, this relies on the user having set their interface language to something other than `en-US`/`en`, and many English-speaking non-US users still have that interface language (eg: there's no English locale available in our settings for Argentinian English so such users would probably still have `en`). As a result, those users will see a price with `$` and could be misled about what currency is being displayed. Setting `geoLocation` helps prevent that from happening by showing `US$` for those users.

For practical usages, see the wp-calypso monorepo.

## Dev

### Setup

We try to keep a similar functional separation with `Intl.NumberFormat( ... ).format( ... )`:

```
src/
├── number-format-currency/index.ts
├── number-format.ts { numberformat, numberFormatCompact }
```

- these bring back cached instances of `Intl.NumberFormat()`
- exported on their own, they require a `locale` to be passed as a parameter (we don't currently export these, but we can down the line)
- the above isn't the case yet for `number-format-currency`. It returns the formatted number, so it's essentially a full `Intl.NumberFormat( ... ).format( ... )` call. It may receive a refactor to sync down the line, which will hopefully improve some of the code sharing

```
src/
├── create-number-formatters.ts { formatNumber, formatNumberCompact, formatCurrency, etc.}
```

- a closure to handle `locale` state, returning abstractions over the number formatters from above, called `formatNumber`, `formatNumberCompact`, etc.
- the methods accept arguments to parameterise the underlying formatters and enable conveniences over common usages (e.g. a convenient `decimals` prop)

Adding a new formatter to the mix, say "formatPercentage", would basically just repeat what we've done for "compact" numbers: a method returned from `create-number-formatters.ts` and a function in `number-format.ts` (or separate file if anything deeper than a few simple defaults).

### Workflow

When making changes, the package can be built individually via `jetpack build -v js-packages/number-formatters` (assuming the [CLI tool](`https://github.com/Automattic/jetpack/blob/trunk/tools/cli/README.md`) has been set up) or `pnpm run build` (JP uses `pnpm`), and the latest version linked via npm/yarn to a respective outside repo to test e.g. wp-calypso.

Once changes are submitted/merged, the typical Jetpack workflow should be followed to publish the changes to NPM.
