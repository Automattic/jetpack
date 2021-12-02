Searchable Modules
==============

This component is meant to be a searchable container which will surface the modules that do not have any
UI in any of the other primary settings tabs.

The results rendered will either show a Banner, with a prop to activate, or if the module is already active,
it will show a standard info card about the feature.  The content in the 'active' cards is pulled from
the module headers themselves from the {module-slug}.php files.

It is connected to the Redux store, which is where it gets the module data from.
It only needs to be fed search terms (string) as a prop.

#### How to use:

```js

import SearchableModules from 'searchable-modules/index.jsx';
render: function() {
    return (
        <SearchableModules searchTerm={ this.props.searchTerm } />
    );
}

}
```