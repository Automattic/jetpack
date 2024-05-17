# ToggleSection component

This component is used on the Social Admin page. It wraps a Jetpack styled toggle, title,
and description.

```es6
import ToggleSection from '../toggle-section';
import { useSelect } from '@wordpress/data';

function MyFunctionalComponent() {
    const { isUpdating, isModuleEnabled, toggleModule } = useSelect( select => {
        ...
    }, [] );

    return (
        <ToggleSection
            title={ 'My title' }
            disabled={ isUpdating }
            checked={ isModuleEnabled }
            onChange={ toggleModule }
        >
            <div>
                {...}
            </div>
        </ToggleSection>
    );
}
```
