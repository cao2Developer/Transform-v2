The component has four states: inactive, active, error and read only.

<!-- The Skeleton export checks its canvases against this list. Keep one line per state, in this format. -->

- **Inactive:** the field is ready to receive input.
- **Active:** the field has keyboard focus and follows the Active State pattern.
- **Error:** the field shows a red border and an error icon. The error appears after the form is submitted with a missing or invalid value.
- **Read only:** the field shows its value, or its placeholder when empty, but users cannot change it. It follows the Read Only State pattern.

Active can be combined with Error, and with Read only when the field receives keyboard focus. Read only is never combined with Error.
