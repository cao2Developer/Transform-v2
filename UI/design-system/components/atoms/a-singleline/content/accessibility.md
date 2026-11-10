<!-- Inside a cell, Markdown blocks do not work: write each paragraph in <p> and each reference in <li>. Links and `code` in Markdown work inside them. -->

<div class="docs-table sb-unstyled">
<table>
<thead>
<tr>
<th scope="col">Topic</th>
<th scope="col">Guidance</th>
<th scope="col">References</th>
</tr>
</thead>
<tbody>
<tr>
<th scope="row">Labeling</th>
<td>
<p>Always pair the input with a visible `<label>` element using the `for` attribute. Use `aria-label` only when the purpose of the field is clear from the surrounding content.</p>
</td>
<td>
<ul>
<li>[W3C WAI Tutorials: Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/) <span class="docs-table-wcag">WCAG 1.3.1, 3.3.2</span></li>
</ul>
</td>
</tr>
<tr>
<th scope="row">Keyboard interaction</th>
<td>
<p>Users can navigate to and from the input using `Tab` and `Shift+Tab`. The `Enter` key triggers form submission when appropriate.</p>
</td>
<td>
<ul>
<li>[W3C WCAG 2.2 Understanding: Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) <span class="docs-table-wcag">WCAG 2.1.1</span></li>
</ul>
</td>
</tr>
<tr>
<th scope="row">Read only state</th>
<td>
<p>Use the native `readonly` attribute, not `disabled`, because a disabled field does not send its value with the form. The field stays in the focus order of the `Tab` key, so users can reach it, review its value and copy it.</p>
<p>Do not add `aria-readonly="true"`, because the native `readonly` attribute already exposes the read only state. The `required` attribute has no effect on a read only field.</p>
</td>
<td>
<ul>
<li>[MDN: readonly HTML attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/readonly)</li>
<li>[MDN: ARIA: aria-readonly attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-readonly)</li>
</ul>
</td>
</tr>
<tr>
<th scope="row">Error state</th>
<td>
<p>Set `aria-invalid="true"` on the field only after the form is submitted with a missing or invalid value. Link the field to its error message with `aria-describedby`, so screen readers announce the message together with the field.</p>
<p>The error icon and the message show the error without depending on color alone.</p>
</td>
<td>
<ul>
<li>[MDN: ARIA: aria-invalid attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)</li>
<li>[W3C WAI Tutorials: User Notification](https://www.w3.org/WAI/tutorials/forms/notifications/) <span class="docs-table-wcag">WCAG 3.3.1</span></li>
<li>[W3C WCAG 2.2 Understanding: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) <span class="docs-table-wcag">WCAG 1.4.1</span></li>
</ul>
</td>
</tr>
</tbody>
</table>
</div>
