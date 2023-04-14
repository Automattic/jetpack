Toggle
=========

This component is used to implement toggle switches.

#### How to use:

```js
import { useCallback, useState } from 'react';
import { FormToggle } from '@automattic/jetpack-components';

const MyToggle = () => {
    const [ checked, setChecked ] = useState( false );
    const [ disabled, setDisabled ] = useState( false );

    const onChange = useCallback( () => {
        setChecked( ! checked );
    }, [ checked ] );

    return (
        <FormToggle
            ariaLabel={ checked ? 'Turn off' : 'Turn on' }
            disabled={ disabled }
            disabledReason="This toggle is disabled because of reasons."
            checked={ checked }
            onChange={ onChange }
        >
            { checked ? 'On' : 'Off' }
        </FormToggle>
    );
}
```
