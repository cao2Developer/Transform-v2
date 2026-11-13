import Component from './component';
import VisibilityRulesProcessor from './visibility-rules-processor';

export default class OPaletteHistoryEntry extends Component {
    private Block: HTMLElement | null = null;
    private visibilityRulesProcessor = new VisibilityRulesProcessor();

    private initializeShadowRoot(): void {
        if (this.shadowRoot) return;

        const template: HTMLTemplateElement | null =
            this.closest('o-block')?.querySelector('o-history template') ??
            null;

        if (!template) return;

        const style = document.createElement('style');
        style.innerHTML = `
            :host {
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                transition: background-color 150ms ease-in-out;
            }
            :host(.active) {
                background: var(--color-bg-system-warning-subtle, #fff6e5);
            }
            :host(.delete-confirm),
            :host(.active.delete-confirm) {
                background: var(
                    --color-bg-system-error-subtle,
                    rgb(var(--color-error, 218, 41, 17), 0.15)
                );
            }
            :is(.complexquestion-edit, .complexquestion-reset) {
                opacity: 0;
                pointer-events: none;
                transition: opacity 150ms ease-in-out;
            }
            :host(.active) :is(.complexquestion-edit, .complexquestion-reset) {
                opacity: 1;
                pointer-events: none;
            }
            .complexquestion-delete {
                display: none !important;
            }
            :host(.active) .complexquestion-delete {
                display: inline-flex !important;
                pointer-events: auto;
            }
            .l-col-history {
                display: flex;
            }
            ftd-rule {
                color: var(--color-secondary);
                cursor: pointer;
            }
            ftd-rule.unavailable {
                display: none;
            }
            ftd-rule.unavailable.do-not-collapse {
                display: initial;
                visibility: hidden;
            }
            :is(
                .complexquestion-edit,
                .complexquestion-reset,
                .complexquestion-delete
            ) {
                align-items: center;
                border: 1px solid var(--color-primary, #1f1f1f);
                display: inline-flex;
                justify-content: center;
                width: 36px;
                height: 33px;
            }
            .complexquestion-edit {
                background-color: var(--color-bg-neutral-primary, #ffffff);
                background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%231f1f1f%22%3E%3Cpath%20d%3D%22M200-200h57l391-391-57-57-391%20391v57Zm-80%2080v-170l528-527q12-11%2026.5-17t30.5-6q16%200%2031%206t26%2018l55%2056q12%2011%2017.5%2026t5.5%2030q0%2016-5.5%2030.5T817-647L290-120H120Zm640-584-56-56%2056%2056Zm-141%2085-28-29%2057%2057-29-28Z%22%2F%3E%3C%2Fsvg%3E");
                background-position: center;
                background-repeat: no-repeat;
            }
            .complexquestion-delete {
                background-color: var(--color-bg-neutral-primary, #ffffff);
                background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%200%2024%2024%22%20width%3D%2224px%22%20fill%3D%22%231f1f1f%22%3E%3Cpath%20d%3D%22M16%209V19H8V9H16ZM14.5%203H9.5L8.5%204H5V6H19V4H15.5L14.5%203ZM18%207H6V19C6%2020.1%206.9%2021%208%2021H16C17.1%2021%2018%2020.1%2018%2019V7Z%22%2F%3E%3C%2Fsvg%3E");
                background-position: center;
                background-repeat: no-repeat;
            }
            .l-col-history {
                justify-content: end;
            }`;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(template.content.cloneNode(true));
    }

    render(): void {
        this.shadowRoot?.querySelectorAll('ftd-rule').forEach((ftd) => {
            this.processVisibility(ftd);

            if (ftd.getAttribute('type') !== 'variable') return;
            const associateControl = ftd.getAttribute('data-associate-control');
            if (!associateControl) return;

            ftd.textContent =
                this.getAttribute(`data-label-${associateControl}`) ||
                this.getAttribute(`data-${associateControl}`) ||
                '';
        });
    }

    private processVisibility(ftd: Element): void {
        const properties = this.parsePropertiesFrom(ftd as HTMLElement);
        const rules =
            Object.keys(properties).length > 0
                ? (properties as ReturnType<typeof this.getVisibilityRules>)
                : this.getVisibilityRules(ftd.getAttribute('data-properties'));
        const visibleRule = rules.visible?.rules ?? '';
        const invisibleRule = rules.invisible?.rules ?? '';

        ftd.classList.remove('unavailable', 'do-not-collapse');
        if (!visibleRule && !invisibleRule) return;

        let available = true;
        let collapse = true;
        const valueScope = this.getVisibilityValueScope();
        if (!valueScope) return;
        if (visibleRule) {
            const parsedRule =
                this.visibilityRulesProcessor.parseVisibilityRules(visibleRule);
            this.visibilityRulesProcessor.getQuestionValues(valueScope);
            available = this.visibilityRulesProcessor.evaluateRule(
                this.visibilityRulesProcessor.insertQuestionValuesIntoRule(
                    parsedRule,
                ),
            );
            collapse = rules.visible?.collapse ?? true;
        }
        if (invisibleRule) {
            const parsedRule =
                this.visibilityRulesProcessor.parseVisibilityRules(
                    invisibleRule,
                );
            this.visibilityRulesProcessor.getQuestionValues(valueScope);
            if (
                this.visibilityRulesProcessor.evaluateRule(
                    this.visibilityRulesProcessor.insertQuestionValuesIntoRule(
                        parsedRule,
                    ),
                )
            ) {
                available = false;
            }
            collapse = rules.invisible?.collapse ?? collapse;
        }

        if (!available) {
            ftd.classList.add('unavailable');
            if (!collapse) ftd.classList.add('do-not-collapse');
        }
    }

    private getVisibilityValueScope(): HTMLTableRowElement | null {
        const rowIndex = Number(this.getAttribute('data-index'));
        const loop = this.closest('o-block')?.querySelector('o-palette-loop');
        const rows = loop?.querySelectorAll<HTMLTableRowElement>('tr');

        return Number.isInteger(rowIndex) && rowIndex >= 0 && rows
            ? (rows[rowIndex] ?? null)
            : null;
    }

    private getVisibilityRules(value: string | null): {
        visible?: { rules: string; collapse?: boolean };
        invisible?: { rules: string; collapse?: boolean };
    } {
        if (!value) return {};
        try {
            return JSON.parse(value.replace(/&quot;/g, '"'));
        } catch {
            const result: ReturnType<typeof this.getVisibilityRules> = {};
            (['visible', 'invisible'] as const).forEach((type) => {
                const match = value.match(
                    new RegExp(
                        `['"]?${type}['"]?\\s*:\\s*\\{.*?['"]?rules['"]?\\s*:\\s*'(.+?)'\\s*\\}`,
                        'i',
                    ),
                );
                if (match) {
                    result[type] = {
                        rules: match[1],
                        collapse: !/collapse\s*:\s*false/i.test(match[0]),
                    };
                }
            });
            return result;
        }
    }

    public handleEvent(event: Event): void {
        if (
            (event.target as Element | null)?.closest?.('o-block') !==
            this.Block
        ) {
            return;
        }
        if (event.type === 'questionChange') this.render();
    }

    private configureSelection(): void {
        this.addEventListener('click', () => {
            this.parentElement
                ?.querySelectorAll('o-palette-history-entry.active')
                .forEach((entry) =>
                    entry.classList.remove('active', 'delete-confirm'),
                );
            this.classList.add('active');
            this.dispatchEvent(
                new CustomEvent('paletteRecordEdit', {
                    bubbles: true,
                    detail: {
                        value: this.getAttribute('data-value') || '',
                        entry: this,
                    },
                }),
            );
        });
    }

    private configureDeleteButton(): void {
        this.shadowRoot
            ?.querySelector('.complexquestion-delete')
            ?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.dispatchEvent(
                    new CustomEvent('paletteRecordDeleteRequest', {
                        bubbles: true,
                    }),
                );
            });
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.initializeShadowRoot();
        this.configureDeleteButton();
        this.Block = this.closest('o-block');
        this.Block?.addEventListener('questionChange', this);
        this.render();
        this.configureSelection();
    }

    public disconnectedCallback(): void {
        this.Block?.removeEventListener('questionChange', this);
        this.Block = null;
    }
}
