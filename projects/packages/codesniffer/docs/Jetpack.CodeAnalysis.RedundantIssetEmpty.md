## Jetpack.CodeAnalysis.RedundantIssetEmpty

This sniff flags the following redundant pairings of `isset()` and `empty()` on the same argument:

```php
isset( $x )   && ! empty( $x )    // `isset()` is redundant
! isset( $x ) && empty( $x )      // `empty()` is redundant
isset( $x )   || ! empty( $x )    // `! empty()` is redundant
! isset( $x ) || empty( $x )      // `! isset()` is redundant
```

For example, this:

```php
if ( isset( $_GET['a'] ) && ! empty( $_GET['a'] ) ) { ... }
```

can be simplified to the following:

```php
if ( ! empty( $_GET['a'] ) ) { ... }
```

The sniff only matches when both calls reference the same single argument, and an inversed operand order is also detected.

Note that if you're sure the variable is defined and you're just testing for truthiness, you can just use the following instead:

```php
if ( ! $a ) { ... }
```

### Limitations

* Multi-argument `isset()` (e.g. `isset( $a, $b )`) is left alone due to complexity (e.g. `empty()` only supports one argument).
* The sniff only inspects the immediate left and right operands of each `&&` / `||` token. Redundancy separated by an intervening clause is **not** detected — for example, `isset( $a ) && do_x() && ! empty( $a )` will pass without warning, even though the `isset( $a )` is still redundant.
* This may generate false positives for function/method calls, assignments inside the argument, and other expressions with observable side effects.

### Messages

* `RedundantIsset`: `! empty( $x )` already implies `isset( $x )`. The `isset()` check is redundant; use `! empty( $x )` alone.
* `RedundantEmpty`: `! isset( $x )` already implies `empty( $x )`. The `empty()` check is redundant; use `! isset( $x )` alone.
* `RedundantNotIsset`: `empty( $x )` already covers `! isset( $x )`. The `! isset()` check is redundant; use `empty( $x )` alone.
* `RedundantNotEmpty`: `isset( $x )` already covers `! empty( $x )`. The `! empty()` check is redundant; use `isset( $x )` alone.

### Configuration

This sniff has no configuration options.
