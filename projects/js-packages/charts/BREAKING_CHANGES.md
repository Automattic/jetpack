# Breaking Changes - PieSemiCircleChart

## Summary

The `label` and `note` props have been removed from `PieSemiCircleChart` in favor of the more flexible composition API using the `children` prop.

## Migration Guide

### Before (Deprecated)
```tsx
<PieSemiCircleChart
  data={data}
  width={400}
  label="Operating Systems"
  note="Windows +10%"
/>
```

### After (New API)

**Option 1: Direct Group usage**
```tsx
import { Group } from '@visx/group';
import { Text } from '@visx/text';

<PieSemiCircleChart
  data={data}
  width={400}
>
  <Group>
    <Text textAnchor="middle" y={-40} fontSize={16} fontWeight={600}>
      Operating Systems
    </Text>
    <Text textAnchor="middle" y={-20} fontSize={14}>
      Windows +10%
    </Text>
  </Group>
</PieSemiCircleChart>
```

**Option 2: Compound components (more explicit)**
```tsx
import { Group } from '@visx/group';
import { Text } from '@visx/text';

<PieSemiCircleChart
  data={data}
  width={400}
>
  <PieSemiCircleChart.SVG>
    <Group>
      <Text textAnchor="middle" y={-40} fontSize={16} fontWeight={600}>
        Operating Systems
      </Text>
      <Text textAnchor="middle" y={-20} fontSize={14}>
        Windows +10%
      </Text>
    </Group>
  </PieSemiCircleChart.SVG>
</PieSemiCircleChart>
```

## Affected Consumer Files

### WooCommerce Analytics

The following files in the WooCommerce Analytics repository need to be updated:

1. **`/js/src/widgets/payments-by-method/payments-by-method.tsx`** (Lines 41-43)
   - Uses: `label="$122K"` and `note="+3%"`
   - Action: Convert to composition API

2. **`/js/src/widgets/taxes-by-code/index.tsx`** (Lines 45-47)
   - Uses: `label={label}` and `note={info}`
   - Action: Convert to composition API

3. **`/js/src/widgets/coupons-widget/coupons-widget.tsx`** (Line 82)
   - Uses: `label=""`
   - Action: Remove empty label prop

4. **`/next-woocommerce-analytics/packages/widgets/src/shared/semi-circle-chart/semi-circle-chart.tsx`** (Line 93)
   - Uses: `label=""`
   - Action: Remove empty label prop

### Jetpack Stats

No breaking changes found - PieSemiCircleChart is not currently used in Jetpack Stats.

## Notes

- The `label=""` empty string usage can simply be removed without replacement
- For actual label/note values, use the composition API examples above
- Import `Group` from `@visx/group` and `Text` from `@visx/text` when using the composition API
