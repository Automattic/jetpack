### v0.2.2 (2018-09-26)

- Fix: Resolve issue where `has` (and consequentally internal reuse such as in `delete`) would wrongly return `false` on keys whose values were assigned as [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy).

### v0.2.1 (2018-07-23)

- Fix: Resolve issue where cloning from another instance of `EquivalentKeyMap` could result in incorrect value assignment on path.

### v0.2.0 (2018-05-04)

- New: Clone from existing `EquivalentKeyMap` instance by passing as constructor argument.
- New: Added `forEach` method and `size` property.
- Improved: Cache last calls to `get` and `set` for lookup shortcutting.

### v0.1.2 (2018-04-26)

- Fix: Avoid conflicts on empty object and array keys.

### v0.1.1 (2018-04-25)

- Fix: Avoid conflicts where objects with numeric keys could be considered equivalent to arrays.

### v0.1.0 (2018-04-24)

- Initial release
