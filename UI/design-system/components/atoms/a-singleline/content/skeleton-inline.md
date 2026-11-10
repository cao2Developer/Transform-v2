The component is a single text field. In the error state, the field shows an error icon at its end. The icon is drawn by the field itself, not by a separate component.

### Dimensions and spacing

32px (`--size-lg`) fixed height and 8px (`--space-sm`) horizontal padding. The text is vertically centered. Only the bottom border is visible and there is no corner radius.

The border is 2px (`--border-width-default`) in the inactive, active and error states and 1px (`--border-width-thin`) in the read only state.

### Error icon

The icon is 16px × 16px (`--size-sm`) and vertically centered. It is 8px (`--space-sm`) from the end edge of the field. There are 8px (`--space-sm`) between the text and the icon. The field reserves this space, so the text never overlaps the icon.

### Responsive behavior

The default width is 200px (`--input-width`). It can be changed per question. The text stays on one line and scrolls horizontally when it is longer than the field.
