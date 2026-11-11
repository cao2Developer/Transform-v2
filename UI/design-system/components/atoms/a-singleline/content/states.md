The component has four states: inactive, active, error and read only.

Active can be combined with Error, and with Read only when the field receives keyboard focus. Read only is never combined with Error.

<!-- The Skeleton export checks its canvases against these titles. Keep one ### title per state, with the state name, and no other ### title. -->

### Inactive

The field is ready to receive input.

### Active

The field has keyboard focus and follows the Active State pattern.

### Error

The field shows a red border and an error icon. The error appears after the form is submitted with a missing or invalid value.

### Read only

The field shows its value, or its placeholder when empty, but users cannot change it. It follows the Read Only State pattern.
