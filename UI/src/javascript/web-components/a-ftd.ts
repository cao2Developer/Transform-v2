import Component from './component';
import FtdRenderer from './ftd-renderer';

export default class AFTD extends Component {
    private Block: HTMLElement | null = null;
    private InProgress: HTMLElement | null = null;
    private Ftd: HTMLElement | null = null;
    private renderer = new FtdRenderer();

    private readonly refreshEvents = [
        'questionChange',
        'input',
        'change',
        'restore',
        'labelChange',
        'paletteControlsChanged',
    ];

    private getControlValue(associateControl: string): {
        value: string | null;
        label: string | null;
    } {
        const controls = Array.from(
            this.InProgress?.querySelectorAll<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >('input, select, textarea') ?? [],
        ).filter(
            (control) =>
                control.closest<HTMLElement>('o-response')?.dataset
                    .associateQuestion === associateControl &&
                !control.matches('.a-input-combobox') &&
                control.value.trim(),
        );
        const matchingControl = controls[controls.length - 1] ?? null;
        const matchingResponse =
            matchingControl?.closest<HTMLElement>('o-response') ?? null;

        if (!matchingControl) return { value: null, label: null };

        const label =
            matchingControl.dataset.label ||
            matchingResponse?.dataset.label ||
            matchingResponse?.querySelector<HTMLElement>('[data-label]')
                ?.dataset.label;

        return {
            value: matchingControl.value,
            label: label?.trim() || null,
        };
    }

    private render(): void {
        if (!this.shadowRoot || !this.Ftd) return;

        this.renderer.render(
            this.shadowRoot,
            this.InProgress,
            (associateControl) => this.getControlValue(associateControl),
            (element) => this.parsePropertiesFrom(element),
        );
    }

    private configurePreview(): void {
        if (!this.Block) return;

        const controlName = this.getAttribute('data-associate-control');
        const template =
            this.Block.querySelector<HTMLTemplateElement>('o-history template');
        const source = Array.from(
            template?.content.querySelectorAll<HTMLElement>('ftd[data-name]') ??
                [],
        ).find((ftd) => ftd.getAttribute('data-name') === controlName);

        if (!source) return;

        const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent =
            ':host { display: inline; } ftd-rule.unavailable { display: none; } ftd-rule.unavailable.do-not-collapse { display: initial; visibility: hidden; }';
        root.appendChild(style);

        this.Ftd = source.cloneNode(true) as HTMLElement;
        root.appendChild(this.Ftd);
    }

    public handleEvent(event: Event): void {
        const target = event.target as Element | null;
        if (target?.closest('o-block') !== this.Block) return;
        if (
            ['input', 'change', 'restore'].includes(event.type) &&
            target?.matches('.a-input-combobox')
        ) {
            return;
        }

        if (
            event.type !== 'paletteControlsChanged' &&
            (!target || !this.InProgress?.contains(target))
        ) {
            return;
        }

        this.render();
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.Block = this.closest('o-block');
        this.InProgress =
            this.Block?.querySelector<HTMLElement>('.palette-inprogress') ??
            null;
        this.configurePreview();
        this.refreshEvents.forEach((event) =>
            this.Block?.addEventListener(event, this),
        );
        this.render();
    }

    public disconnectedCallback(): void {
        this.refreshEvents.forEach((event) =>
            this.Block?.removeEventListener(event, this),
        );
        this.Block = null;
        this.InProgress = null;
        this.Ftd = null;
    }
}
