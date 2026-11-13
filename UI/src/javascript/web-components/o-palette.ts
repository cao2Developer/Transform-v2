import Component from './component';
import OPaletteLoop from './o-palette-loop';
import { Observer, Subject } from '../interfaces';

export default class OPalette extends Component implements Subject {
    protected observers: Observer[] = [];
    private Block: HTMLElement | null = null;
    private OwnerBlock: HTMLElement | null = null;
    private Complete: HTMLElement | null = null;
    private Empty: HTMLElement | null = null;
    private AddButton: HTMLElement | null = null;
    private SubmitButton: HTMLElement | null = null;
    private CancelButton: HTMLElement | null = null;
    private DeleteButton: HTMLElement | null = null;
    private loop: OPaletteLoop | null = null;
    private editingRow: HTMLTableRowElement | null = null;
    private RemainingAnswerCount: number = 0;
    private isInitialized: boolean = false;
    private isConfirmingDelete: boolean = false;

    private setState(state: 'empty' | 'inprogress' | 'complete'): void {
        this.Empty?.classList.toggle('hidden', state !== 'empty');
        this.Block?.classList.toggle('hidden', state !== 'inprogress');
        this.Complete?.classList.toggle('hidden', state !== 'complete');
        this.AddButton?.classList.toggle(
            'hidden',
            state !== 'empty' || this.RemainingAnswerCount <= 0,
        );
    }

    public handleEvent(e: CustomEvent): void {
        switch (e.type) {
            case 'cloneQuestion':
                this.cloneQuestion(e);
                break;
            case 'answerCountChange':
                if (
                    (e.target as Element | null)?.closest?.('o-block') !==
                    this.OwnerBlock
                ) {
                    return;
                }
                this.handleAnswerCountChange(e);
                break;
            case 'paletteRecordDeleteRequest':
                this.handleRecordDeleteRequest(e);
                break;
        }
    }

    private handleRecordDeleteRequest(event: Event): void {
        const target = event.target as Element | null;
        if (
            !target ||
            !this.OwnerBlock ||
            target.closest('o-block') !== this.OwnerBlock
        ) {
            return;
        }

        const entry = target.closest(
            'o-palette-history-entry',
        ) as HTMLElement | null;
        if (
            !entry ||
            !this.editingRow ||
            !entry.classList.contains('active') ||
            entry !== this.getEditingHistoryEntry()
        ) {
            return;
        }

        this.handleDeleteClick();
    }

    private handleRecordEdit = (event: Event): void => {
        if (
            (event.target as Element | null)?.closest?.('o-block') !==
            this.OwnerBlock
        ) {
            return;
        }

        const detail = (event as CustomEvent<{ entry: HTMLElement }>).detail;
        const index = Number(detail?.entry?.getAttribute('data-index'));
        const rows = this.loop?.querySelectorAll<HTMLTableRowElement>('tr');

        if (!rows || !Number.isInteger(index) || index < 0 || !rows[index]) {
            return;
        }

        this.resetDeleteConfirmation();
        this.editingRow = rows[index];
        this.cloneQuestion(event as CustomEvent);

        const valuesByQuestion = new Map<string, string>();
        this.editingRow
            .querySelectorAll<HTMLInputElement>('input')
            .forEach((input) => {
                const response = input.closest<HTMLElement>('o-response');
                const question = response?.dataset.associateQuestion;
                if (question) valuesByQuestion.set(question, input.value);
            });

        this.Block?.querySelectorAll<HTMLInputElement>('input').forEach(
            (input) => {
                const response = input.closest<HTMLElement>('o-response');
                const question = response?.dataset.associateQuestion;
                const value = question ? valuesByQuestion.get(question) : null;
                if (value !== null && value !== undefined) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            },
        );
    };

    private handleAnswerCountChange(e: CustomEvent): void {
        this.RemainingAnswerCount = e.detail.remainingAnswerCount;
        this.updateAddButtonVisibility();
        this.notifyObservers('answerCountChange', e);

        // The loop can finish initialising after the palette. In that case,
        // use its first count event to make the empty state interactive.
        if (this.Block?.classList.contains('hidden')) {
            this.setState(
                this.RemainingAnswerCount === 0 ? 'complete' : 'empty',
            );
        }
    }

    private cloneQuestion(e?: CustomEvent | Event): void {
        e?.stopImmediatePropagation();

        if (!this.Block) return;

        this.clearBlock();

        const elements: NodeListOf<HTMLElement> = this.Block.querySelectorAll(
            '[data-associate-type]',
        );

        elements.forEach((element) => {
            const associateType = element.dataset.associateType;
            const associateName = element.dataset.associateQuestion;
            let source: Node | null = null;

            const response = Array.from(
                this.closest('o-block')?.querySelectorAll<HTMLElement>(
                    'o-response',
                ) ?? [],
            ).find(
                (candidate) =>
                    candidate.dataset.associateQuestion === associateName,
            );

            switch (associateType) {
                case 'label':
                    if (response) {
                        const inputIds = new Set(
                            Array.from(
                                response.querySelectorAll<HTMLInputElement>(
                                    'input[id]',
                                ),
                            ).map((input) => input.id),
                        );
                        source =
                            Array.from(
                                response.querySelectorAll<HTMLLabelElement>(
                                    'label[for]',
                                ),
                            )
                                .find((label) => inputIds.has(label.htmlFor))
                                ?.cloneNode(true) ?? null;
                    }

                    // Keep supporting pages where the question label is outside
                    // the response and is a direct child of o-question.
                    source ??=
                        response
                            ?.closest('o-question')
                            ?.querySelector(':scope > label')
                            ?.cloneNode(true) ?? null;
                    break;
                case 'control':
                    source = document.createElement('o-question');
                    if (!response) {
                        console.warn(
                            `Palette source element ${associateName} not found!`,
                        );
                        return;
                    }
                    const clonedResponse = response.cloneNode(
                        true,
                    ) as HTMLElement;
                    // Custom elements in the response are upgraded again when
                    // this clone is inserted. Let them initialise their
                    // behaviour, but avoid rebuilding generated scaffolding.
                    clonedResponse.setAttribute('data-palette-clone', 'true');
                    source.appendChild(clonedResponse);
                    break;
            }

            if (!source) {
                console.warn(
                    `Palette source element ${associateName} not found!`,
                );
                return;
            }

            if (associateType === 'label' && source instanceof HTMLElement) {
                source.classList.toggle(
                    'unavailable',
                    response?.classList.contains('unavailable') ?? false,
                );
            }

            element.appendChild(source);
        });

        this.updateDeleteButtonVisibility();
        this.setState('inprogress');
        this.notifyControlsChanged();
    }

    private clearBlock(): void {
        this.Block?.querySelectorAll('[data-associate-type]').forEach(
            (element) => {
                element.replaceChildren();
            },
        );
        this.notifyControlsChanged();
    }

    private notifyControlsChanged(): void {
        this.dispatchEvent(
            new CustomEvent('paletteControlsChanged', { bubbles: true }),
        );
    }

    private configureSubmitButton(): void {
        this.SubmitButton = this.querySelector(
            '.palette-inprogress .complexbutton-submit, .palette-inprogress .complexbutton-add, .palette-inprogress .a-button-icon.submit',
        );

        if (!this.SubmitButton) {
            console.warn('Submit button not found');
            return;
        }

        this.SubmitButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitRecord();
        });
    }

    private configureCancelButton(): void {
        this.CancelButton = this.querySelector(
            '.palette-inprogress .complexbutton-cancel, .palette-inprogress .a-button-icon.cancel',
        );

        if (!this.CancelButton) {
            console.warn('Cancel button not found');
            return;
        }

        this.CancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.cancelRecord();
        });
    }

    private configureDeleteButton(): void {
        this.DeleteButton = this.querySelector(
            '.palette-inprogress .complexbutton-delete, .palette-inprogress .a-button-icon.delete',
        );

        if (!this.DeleteButton) {
            return;
        }

        this.DeleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleDeleteClick();
        });
    }

    private resetDeleteConfirmation(): void {
        this.isConfirmingDelete = false;
        this.DeleteButton?.classList.remove('delete-confirm');
        this.OwnerBlock?.querySelectorAll(
            'o-palette-history-entry.delete-confirm',
        ).forEach((entry) => entry.classList.remove('delete-confirm'));
        this.editingRow?.classList.remove('delete-confirm');
    }

    private getEditingHistoryEntry(): HTMLElement | null {
        if (!this.editingRow || !this.loop) {
            return (
                this.OwnerBlock?.querySelector(
                    'o-palette-history-entry.active',
                ) ?? null
            );
        }

        const rowIndex = Array.from(this.loop.querySelectorAll('tr')).indexOf(
            this.editingRow,
        );

        if (rowIndex >= 0) {
            const entry = this.OwnerBlock?.querySelector<HTMLElement>(
                `o-palette-history-entry[data-index="${rowIndex}"]`,
            );
            if (entry) return entry;
        }

        return (
            this.OwnerBlock?.querySelector('o-palette-history-entry.active') ??
            null
        );
    }

    private handleDeleteClick(): void {
        if (!this.editingRow) return;

        if (!this.isConfirmingDelete) {
            this.isConfirmingDelete = true;
            this.DeleteButton?.classList.add('delete-confirm');
            const entry = this.getEditingHistoryEntry();
            entry?.classList.add('delete-confirm');
            this.editingRow?.classList.add('delete-confirm');
            return;
        }

        this.deleteRecord();
    }

    private deleteRecord(): void {
        if (!this.editingRow || !this.loop) return;

        const editingRow = this.editingRow;
        const rowIndex = Array.from(this.loop.querySelectorAll('tr')).indexOf(
            editingRow,
        );

        const entry =
            rowIndex >= 0
                ? this.OwnerBlock?.querySelector(
                      `o-palette-history-entry[data-index="${rowIndex}"]`,
                  )
                : null;

        this.resetDeleteConfirmation();

        editingRow
            .querySelectorAll<HTMLInputElement>('input')
            .forEach((input) => {
                input.value = '';
            });

        this.clearBlock();
        this.editingRow = null;

        this.loop.refreshAnswerCount();
        this.updateRemainingAnswers();
        this.updateDeleteButtonVisibility();
        this.setState(this.RemainingAnswerCount === 0 ? 'complete' : 'empty');

        this.dispatchEvent(
            new CustomEvent('paletteRecordDelete', {
                bubbles: true,
                detail: {
                    row: editingRow,
                    entry: entry ?? undefined,
                },
            }),
        );
    }

    private submitRecord(): void {
        if (!this.loop || !this.Block) return;

        const nextRow = this.editingRow ?? this.loop.getNextAvailableRow();
        if (!nextRow) return;

        // Collect all inputs in the palette-inprogress block with their associate questions
        const inputsByQuestion = new Map<string, HTMLInputElement>();
        const labelsByQuestion = new Map<string, string>();
        this.Block.querySelectorAll<HTMLInputElement>('input').forEach(
            (input) => {
                const response = input.closest<HTMLElement>('o-response');
                const associateQuestion = response?.dataset.associateQuestion;
                if (associateQuestion && input.value.trim()) {
                    inputsByQuestion.set(associateQuestion, input);
                    const label =
                        input.dataset.label ||
                        response?.dataset.label ||
                        response?.querySelector<HTMLElement>('[data-label]')
                            ?.dataset.label;
                    if (label) labelsByQuestion.set(associateQuestion, label);
                }
            },
        );

        if (inputsByQuestion.size === 0) return;

        // Fill all cells in the next row that have matching associate questions
        let rowDataFound = false;
        nextRow.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
            const response = input.closest<HTMLElement>('o-response');
            const associateQuestion = response?.dataset.associateQuestion;
            if (associateQuestion && inputsByQuestion.has(associateQuestion)) {
                const sourceInput = inputsByQuestion.get(associateQuestion)!;
                input.value = sourceInput.value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                rowDataFound = true;
            }
        });

        if (!rowDataFound) return;

        if (this.editingRow) {
            nextRow
                .querySelectorAll<HTMLInputElement>('input')
                .forEach((input) => {
                    const response = input.closest<HTMLElement>('o-response');
                    const question = response?.dataset.associateQuestion;
                    if (question && !inputsByQuestion.has(question)) {
                        input.value = '';
                    }
                });
        }

        this.resetDeleteConfirmation();
        this.editingRow = null;
        this.loop.refreshAnswerCount();
        this.updateRemainingAnswers();
        this.updateDeleteButtonVisibility();

        if (this.RemainingAnswerCount === 0) {
            this.clearBlock();
            this.setState('complete');
        } else {
            this.cloneQuestion();
        }

        const firstValue =
            Array.from(inputsByQuestion.values())[0]?.value || '';

        this.dispatchEvent(
            new CustomEvent('paletteRecordCommitted', {
                bubbles: true,
                detail: {
                    value: firstValue,
                    row: nextRow,
                    labels: Object.fromEntries(labelsByQuestion),
                },
            }),
        );
    }

    private cancelRecord(): void {
        this.resetDeleteConfirmation();
        this.clearBlock();
        this.editingRow = null;
        // Cancelling does not change the loop count, but observers still need
        // the current count so the add button can become active again.
        this.updateRemainingAnswers();
        this.updateDeleteButtonVisibility();
        this.setState(this.RemainingAnswerCount === 0 ? 'complete' : 'empty');
        this.dispatchEvent(
            new CustomEvent('paletteRecordCancelled', { bubbles: true }),
        );
    }

    private configureLoop(): void {
        this.loop =
            this.closest('o-block')?.querySelector('o-palette-loop') ?? null;
    }

    private updateRemainingAnswers(): void {
        if (!this.loop) return;

        this.RemainingAnswerCount = this.loop.getRemainingAnswerCount();
        this.notifyObservers(
            'answerCountChange',
            new CustomEvent('answerCountChange', {
                detail: { remainingAnswerCount: this.RemainingAnswerCount },
            }),
        );
    }

    public getRemainingAnswerCount(): number {
        return this.RemainingAnswerCount;
    }

    addObserver(observer: Observer): void {
        this.observers.push(observer);

        // Only notify immediately if palette is already initialised
        // Otherwise, the observer will be notified once initialisation is complete
        if (this.isInitialized) {
            const answerCount = new CustomEvent('answerCountChange', {
                detail: {
                    remainingAnswerCount: this.getRemainingAnswerCount(),
                },
            });
            observer.update('answerCountChange', answerCount);
        }
    }

    removeObserver(observer: Observer): void {
        const obsIndex = this.observers.findIndex(
            (obs: Observer): boolean => observer === obs,
        );

        if (obsIndex < 0) {
            console.error('Observer does not exist!');
            return;
        }

        this.observers.splice(obsIndex, 1);
    }

    notifyObservers(method: string, detail: Event): void {
        for (const observer of this.observers) {
            observer.update(method, detail);
        }
    }

    private configureBlock(): void {
        this.Block = this.querySelector('.palette-inprogress');
    }

    private configureComplete(): void {
        this.Complete = this.querySelector('.palette-complete');
    }

    private configureEmpty(): void {
        this.Empty = this.querySelector('.palette-empty');
    }

    private configureAddButton(): void {
        this.AddButton =
            this.Empty?.querySelector('.complexbutton-add') ?? null;

        if (!this.AddButton) return;

        this.AddButton.addEventListener('click', (e) => {
            e.preventDefault();

            if (!this.getRemainingAnswerCount()) {
                console.warn('The loop is fully populated.');
                return;
            }

            this.resetDeleteConfirmation();
            this.editingRow = null;
            this.OwnerBlock?.querySelectorAll(
                'o-palette-history-entry.active',
            ).forEach((entry) => entry.classList.remove('active'));

            this.AddButton?.dispatchEvent(
                new CustomEvent('cloneQuestion', { bubbles: true }),
            );
        });
    }

    private updateDeleteButtonVisibility(): void {
        this.DeleteButton?.classList.toggle('hidden', !this.editingRow);
        if (!this.editingRow) {
            this.DeleteButton?.classList.remove('delete-confirm');
        }
    }

    private updateAddButtonVisibility(): void {
        this.AddButton?.classList.toggle(
            'hidden',
            this.RemainingAnswerCount <= 0,
        );
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener('cloneQuestion', this);
        this.configureSubmitButton();
        this.configureCancelButton();
        this.configureDeleteButton();
        this.updateDeleteButtonVisibility();
        this.configureLoop();
        this.OwnerBlock = this.closest('o-block');
        this.OwnerBlock?.addEventListener('answerCountChange', this);
        this.OwnerBlock?.addEventListener('paletteRecordDeleteRequest', this);
        this.OwnerBlock?.addEventListener(
            'paletteRecordEdit',
            this.handleRecordEdit,
        );
        this.configureEmpty();
        this.configureBlock();
        this.configureComplete();
        this.configureAddButton();

        queueMicrotask(() => {
            // Ensure loop is found
            if (!this.loop) this.configureLoop();

            // Wait for loop to finish initialising its row count
            if (this.loop && !this.loop.isLoopInitialized?.()) {
                queueMicrotask(() => {
                    this.updateRemainingAnswers();
                    this.setState(
                        this.RemainingAnswerCount === 0 ? 'complete' : 'empty',
                    );
                    this.isInitialized = true;
                    // Notify all observers that were added before initialisation
                    this.notifyObservers(
                        'answerCountChange',
                        new CustomEvent('answerCountChange', {
                            detail: {
                                remainingAnswerCount: this.RemainingAnswerCount,
                            },
                        }),
                    );
                });
            } else {
                // Loop is already initialised or doesn't exist, update now
                this.updateRemainingAnswers();
                this.setState(
                    this.RemainingAnswerCount === 0 ? 'complete' : 'empty',
                );
                this.isInitialized = true;
                // Notify all observers that were added before initialisation
                this.notifyObservers(
                    'answerCountChange',
                    new CustomEvent('answerCountChange', {
                        detail: {
                            remainingAnswerCount: this.RemainingAnswerCount,
                        },
                    }),
                );
            }
        });
    }

    public disconnectedCallback(): void {
        this.removeEventListener('cloneQuestion', this);
        this.OwnerBlock?.removeEventListener('answerCountChange', this);
        this.OwnerBlock?.removeEventListener(
            'paletteRecordDeleteRequest',
            this,
        );
        this.OwnerBlock?.removeEventListener(
            'paletteRecordEdit',
            this.handleRecordEdit,
        );
        this.OwnerBlock = null;
    }
}
