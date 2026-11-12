import Component from './component';
import OCombobox from './o-combobox';
import ODropdown from './o-dropdown';
import { Observer } from '../interfaces';
import { JsonObject } from './util';

interface CustomProperties extends JsonObject {
    exact: boolean;
    filter: {
        source: string;
        exclusions: Array<string>;
    };
    filtertype: string;
    jumptofirstletter: boolean;
    listsize: number;
    mincharactersforlist: number;
    notenoughcharacters: string;
    noitemsinlist: string;
}

export default class OList extends Component implements Observer {
    public properties: CustomProperties = {
        exact: true,
        filter: {
            source: '',
            exclusions: [],
        },
        filtertype: '',
        jumptofirstletter: false,
        listsize: 6,
        mincharactersforlist: 0,
        notenoughcharacters: 'Keep typing...',
        noitemsinlist: 'No matching entries',
    };

    protected element: HTMLInputElement | null = null;
    private listElement: HTMLElement | null = null;
    private listHighlightedIndex = -1;
    private listSelectedIndex = -1;
    private control: OCombobox | ODropdown | null = null;
    private list: Array<HTMLLIElement> = [];
    private visibleList: Array<HTMLLIElement> = [];
    private keyBuffer = '';
    private keyTimer: ReturnType<typeof setTimeout>;
    private keyBufferTimeout = 500;
    private controlHeight = 38;
    private initialHeight = 0;
    private isConfigured = false;
    private positionFrame: number | null = null;
    private suppressClickEventPropagation = false;

    constructor() {
        super();

        this.keyTimer = setTimeout(() => {
            this.clearKeyBuffer();
        }, this.keyBufferTimeout);

        this.setListElement();
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.oneTimeConfiguration();
        this.restoreSelection();
        this.updateScrollPosition();

        this.addEventListener('mousedown', this.handleEvent);
        this.addEventListener('mouseleave', this.handleEvent);
        this.addEventListener('mouseover', this.handleEvent);
        this.addEventListener('keydown', this.handleEvent);
        this.addEventListener('keyup', this.handleEvent);
        this.addEventListener('restore', this.handleEvent);
        document.addEventListener('scroll', this);
        window.visualViewport?.addEventListener('resize', this);
        window.visualViewport?.addEventListener('scroll', this);

        if (this.response) this.response.addObserver(this);
    }

    public disconnectedCallback(): void {
        this.removeEventListener('mousedown', this.handleEvent);
        this.removeEventListener('mouseleave', this.handleEvent);
        this.removeEventListener('mouseover', this.handleEvent);
        this.removeEventListener('keydown', this.handleEvent);
        this.removeEventListener('keyup', this.handleEvent);
        this.removeEventListener('restore', this.handleEvent);
        document.removeEventListener('scroll', this);
        window.visualViewport?.removeEventListener('resize', this);
        window.visualViewport?.removeEventListener('scroll', this);

        if (this.positionFrame !== null) {
            cancelAnimationFrame(this.positionFrame);
            this.positionFrame = null;
        }

        if (this.response) this.response.removeObserver(this);
    }

    private oneTimeConfiguration(): void {
        if (this.isConfigured) return;

        this.buildList();
        this.buildVisibleList();
        this.setInitialListHeight();

        this.createNotEnoughCharactersMessage();
        this.createNoItemsInListMessage();
        this.initialMinCharacterMessage();
        this.setFilterMethod();

        this.control = this.closest('o-dropdown, o-combobox');
        this.closest('o-question')?.addEventListener('scroll', this);

        if (this.control) {
            this.control.addObserver(this);
            this.addVisibilityObserver();
            this.removeTabIndex();
        }

        this.isConfigured = true;
    }

    public update(method: string, data: CustomEvent | Event): void {
        switch (method) {
            case 'keypress':
                this.handleEvent(data);
                break;
            case 'clearValue':
            case 'clearOtherValues':
                this.clearValue();
                break;
            case 'clearExclusiveOptions':
                this.clearValueFromExclusive(data as CustomEvent);
                break;
            case 'newValue':
                this.filterList(data as CustomEvent);
                break;
            case 'optionVisibilityChange':
                this.processFilter(data as CustomEvent);
                break;
            case 'hidden':
                this.clearHighlightedOption();
                this.updateScrollPosition();
                break;
            case 'widthChange':
                this.newWidthFromControl(<CustomEvent>data);
                break;
            case 'addPlaceholderEntry':
                this.addListEntry(
                    (data as CustomEvent).detail.className,
                    (data as CustomEvent).detail.content,
                );
                break;
        }
    }

    public handleEvent(e: Event): void {
        switch (e.type) {
            case 'keydown':
                this.handleKey(e as KeyboardEvent);
                break;
            case 'mousedown':
                this.onClick(e);
                break;
            case 'mouseover':
                this.setHighlightedOptionFromMouse(e);
                break;
            case 'mouseleave':
                this.resetHighlightedOption();
                break;
            case 'restore':
                this.restoreClearedValue();
                break;
            case 'scroll':
            case 'resize':
                this.schedulePositionUpdate(e.target as HTMLElement | Document);
                break;
        }
    }

    private newWidthFromControl(e: CustomEvent): void {
        if (!e.detail || e.detail.width < 1) return;

        const width = `${parseInt(e.detail.width)}px`;

        this.style.maxWidth = width;
        this.style.width = width;
    }

    private clearValue(): void {
        this.clearHighlightedOption();
        this.clearSelectedOptions();
        this.clearElementValue();
        this.clearLabel();
    }

    private clearValueFromLocal(): void {
        this.clearSelectedOptions();
        this.clearElementValue();
    }

    private clearValueFromExclusive(e: CustomEvent): void {
        if (this.isNonExclusiveOptionSource(e)) return;
        if (e.target === this) return;
        if (e.detail.qgroup !== this.qgroup) return;

        this.clearValue();
    }

    private clearElementValue(): void {
        if (!this.element || !this.element.value.length) return;

        this.element.placeholder = this.element.value;
        this.element.value = '';
        this.broadcastChange();
    }

    private buildList(): void {
        this.list = Array.from(
            this.querySelectorAll('li:not([class^="a-list-placeholder-"])'),
        );
        this.indexList();
    }

    private buildVisibleList(): void {
        this.visibleList = Array.from(
            this.querySelectorAll(
                'li:not(.hidden-filter):not(.hidden-rule):not(.hidden-external-filter):not([class^="a-list-placeholder-"])',
            ),
        );
        this.indexVisibleList();
    }

    private indexList(): void {
        this.list.forEach((node, index) => {
            node.dataset.position = `${index}`;
            node.dataset.visiblePosition = `${index}`;
        });
    }

    private indexVisibleList(): void {
        this.list.forEach((node) => {
            node.dataset.visiblePosition = ``;
        });
        this.visibleList.forEach((node, index) => {
            node.dataset.visiblePosition = `${index}`;
        });
    }

    private schedulePositionUpdate(target: HTMLElement | Document): void {
        if (this.positionFrame !== null) {
            cancelAnimationFrame(this.positionFrame);
        }

        this.positionFrame = requestAnimationFrame(() => {
            this.positionFrame = null;

            if (target instanceof VisualViewport) {
                this.updatePosition(document);
                return;
            }

            this.updatePosition(target);
        });
    }

    private updatePosition(target: HTMLElement | Document): void {
        if (target === this) return;
        if (!target.contains(this)) return;
        if (!this.control) return;

        const controlRect = this.control.getBoundingClientRect();
        const listRect = this.getBoundingClientRect();
        const style = window.getComputedStyle(this);
        const border = this.getBorderThickness();

        const opensUp = this.classList.contains('direction-up');
        const desiredLeft = controlRect.left;
        const desiredTop = opensUp
            ? controlRect.top - listRect.height + 7
            : controlRect.bottom - border;

        this.applyOffset('marginLeft', style, desiredLeft - listRect.left);
        this.applyOffset('marginTop', style, desiredTop - listRect.top);
    }

    private getBorderThickness(): number {
        if (!this.listElement) return 0;

        // The border lives on the inner list and is rem based, so measure it
        // rather than assuming 2px - iOS text size adjustment can inflate it
        const width = parseFloat(
            window.getComputedStyle(this.listElement).borderBlockStartWidth,
        );

        return Number.isNaN(width) ? 0 : width;
    }

    private applyOffset(
        property: 'marginLeft' | 'marginTop',
        style: CSSStyleDeclaration,
        delta: number,
    ): void {
        // Sub-pixel drift is not worth a style write on every scroll frame
        if (Math.abs(delta) < 0.5) return;

        const current = parseFloat(style[property]);

        this.style[property] =
            `${(Number.isNaN(current) ? 0 : current) + delta}px`;
    }

    private handleKey(e: KeyboardEvent): void {
        if (this.isReadonly) return;
        if (!this.checkVisibility({ opacityProperty: true })) return;

        e.stopPropagation();

        switch (e.key) {
            case 'ArrowUp':
                this.clearKeyBuffer();
                this.navigateUp();
                break;
            case 'ArrowDown':
                this.clearKeyBuffer();
                this.navigateDown();
                break;
            case 'Home':
                this.navigateFirst();
                break;
            case 'End':
                this.navigateLast();
                break;
            case 'Enter':
                this.setSelectedOptionByIndex();
                break;
            case 'Tab':
            case 'Escape':
                break;
            default:
                this.keyBuffer += e.key.toLowerCase();
                this.extendKeyBufferTimer();
                this.jumpToLetter(this.keyBuffer);
                break;
        }
    }

    private clearKeyBuffer(): void {
        this.keyBuffer = '';
    }

    private extendKeyBufferTimer(): void {
        clearInterval(this.keyTimer);

        this.keyTimer = setTimeout(() => {
            this.clearKeyBuffer();
        }, this.keyBufferTimeout);
    }

    private navigateFirst(): void {
        if (!this.visibleList.length) return;

        const firstVisibleItem = this.visibleList[0];
        this.setHighlightedOption(firstVisibleItem);
        this.updateScrollPosition();
    }

    private navigateLast(): void {
        if (!this.visibleList.length) return;

        const lastVisibleItem = this.visibleList[this.visibleList.length - 1];
        this.setHighlightedOption(lastVisibleItem);
        this.updateScrollPosition();
    }

    private navigateUp(): void {
        if (this.listHighlightedIndex === 0) return;
        if (!this.visibleList.length) return;

        if (this.listHighlightedIndex === -1) {
            this.navigateLast();
        } else {
            const previousVisibleItem =
                this.visibleList[this.listHighlightedIndex - 1];
            this.setHighlightedOption(previousVisibleItem);
            this.updateScrollPosition();
        }
    }

    private navigateDown(): void {
        if (this.listHighlightedIndex === this.visibleList.length - 1) return;
        if (!this.visibleList.length) return;

        if (this.listHighlightedIndex === -1) {
            this.navigateFirst();
        } else {
            const nextVisibleItem =
                this.visibleList[this.listHighlightedIndex + 1];
            this.setHighlightedOption(nextVisibleItem);
            this.updateScrollPosition();
        }
    }

    private updateScrollPosition(): void {
        const currentItem =
            this.querySelector('.highlight') ??
            this.querySelector('[data-selected="true"]');
        if (!currentItem) return;

        currentItem.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    private resetScrollPosition(): void {
        const currentPosition =
            this.listSelectedIndex > 0 ? this.listSelectedIndex : 0;
        const currentItem = this.visibleList[currentPosition];
        if (!currentItem) return;

        currentItem.scrollIntoView({ block: 'start' });
    }

    private jumpToLetter(input: string): void {
        if (!input.length) {
            return;
        }

        let listPasses = 0;
        let firstLetter: string;
        const highlightEl = this.querySelector('.highlight') as HTMLElement;
        const highlightId = highlightEl?.dataset.position ?? '-1';
        const highlightPos = Number(highlightId);

        if (highlightPos > -1) {
            firstLetter =
                highlightEl.textContent?.substring(0, 1).toLowerCase() || '';
        } else {
            firstLetter =
                this.visibleList[this.listSelectedIndex]?.textContent
                    ?.substring(0, 1)
                    .toLowerCase() || '';
        }

        const startPos = Math.max(0, this.listSelectedIndex, highlightPos);

        for (let i = startPos; i < this.visibleList.length; i++) {
            const currentItem = this.visibleList[i];
            const currentItemLabel = currentItem.innerText.toLowerCase();

            if (currentItemLabel.indexOf(input) === 0) {
                if (
                    (listPasses === 0 &&
                        firstLetter === input.substring(0, 1) &&
                        i < this.listSelectedIndex) ||
                    (currentItem.classList.contains('highlight') &&
                        input.length === 1)
                ) {
                    // this is required if we've reached the end of the list and landed on an active item
                    // as the last element -- we will need to loop back for another pass at this point
                    if (listPasses === 0 && i === this.visibleList.length - 1) {
                        listPasses = 1;
                        i = -1;
                    }
                    continue;
                } else {
                    this.listSelectedIndex = i;
                    this.setHighlightedOption(currentItem);
                    this.updateScrollPosition();
                    return;
                }
            }

            // this is required to reiterate the list for a second time in case we started part way
            // through with an existing selection
            if (listPasses === 0 && i === this.visibleList.length - 1) {
                listPasses = 1;
                i = -1;
            }
        }
    }

    private initialMinCharacterMessage(): void {
        if (this.properties.mincharactersforlist > 0) {
            this.displayMinCharacterMessage(true);
        }
    }

    private filterList(e: CustomEvent): void {
        if (!this.listElement) return;

        const droplistParentNode = this.listElement.parentNode;
        if (!droplistParentNode) return;

        const userInput = e.detail.element.value.toLowerCase();

        const displayMinCharacterMessage =
            userInput.length < this.properties.mincharactersforlist;

        if (userInput.length === 0) {
            this.displayEmptyMessage(false);
            this.displayMinCharacterMessage(displayMinCharacterMessage);
            this.clearValue();
            this.clearFilteredOptions();
            this.clearHighlightedOption();
            this.buildVisibleList();
            this.setDropListDirection(true);
            this.resetScrollPosition();
            return;
        }

        if (userInput.length < this.properties.mincharactersforlist) {
            this.displayEmptyMessage(false);
            this.displayMinCharacterMessage(true);
            this.clearElementValue();
            this.setDropListDirection(true);
            this.clearHighlightedOption();
            this.updateScrollPosition();
            return;
        } else {
            this.displayMinCharacterMessage(false);
        }

        for (const currentItem of this.list) {
            const itemLabelWrapper =
                currentItem.getElementsByClassName('a-label-option')[0];
            const itemLabel = itemLabelWrapper.textContent?.toLowerCase() ?? '';

            if (this.properties.filtertype === 'starts') {
                if (itemLabel.indexOf(userInput) === 0) {
                    currentItem.classList.remove('hidden-filter');
                } else {
                    currentItem.classList.add('hidden-filter');
                }
            }

            if (this.properties.filtertype === 'contains') {
                if (itemLabel.indexOf(userInput) !== -1) {
                    currentItem.classList.remove('hidden-filter');
                } else {
                    currentItem.classList.add('hidden-filter');
                }
            }
        }

        this.buildVisibleList();

        const matchingOptions = this.visibleList.filter((item) => {
            if (item.dataset.readonly === 'true') return false;

            const itemLabel =
                item
                    .getElementsByClassName('a-label-option')[0]
                    .textContent?.toLowerCase() ?? '';

            if (this.properties.filtertype === 'starts') {
                return itemLabel.startsWith(userInput);
            }
            if (this.properties.filtertype === 'contains') {
                return itemLabel.includes(userInput);
            }

            return itemLabel === userInput;
        });
        const exactMatch = this.properties.exact
            ? matchingOptions.find((item) => {
                  const itemLabel =
                      item
                          .getElementsByClassName('a-label-option')[0]
                          .textContent?.toLowerCase() ?? '';

                  return itemLabel === userInput;
              })
            : undefined;

        if (exactMatch) {
            const preserveFilter = matchingOptions.length > 1;

            this.displayEmptyMessage(false);
            this.clearHighlightedOption();
            this.setHighlightedOption(exactMatch);
            this.setSelectedOption(exactMatch, preserveFilter);
            this.updateScrollPosition();

            if (preserveFilter) this.setDropListDirection(true);

            return;
        }

        if (this.properties.exact && this.element?.value) {
            this.clearHighlightedOption();
            this.updateScrollPosition();
            this.clearValueFromLocal();
        }

        if (this.visibleList.length) {
            this.displayEmptyMessage(false);
            this.clearHighlightedOption();
            this.navigateFirst();
        } else {
            this.clearHighlightedOption();
            this.resetScrollPosition();
            this.displayEmptyMessage(true);
        }

        this.setDropListDirection(true);
    }

    private createNotEnoughCharactersMessage(): void {
        this.addListEntry(
            'a-list-placeholder-restriction',
            this.properties.notenoughcharacters,
        );
    }

    private createNoItemsInListMessage(): void {
        this.addListEntry(
            'a-list-placeholder-empty',
            this.properties.noitemsinlist,
        );
    }

    private displayEmptyMessage(visibility: boolean): void {
        if (visibility) {
            this.classList.add('empty');
        } else {
            this.classList.remove('empty');
        }
    }

    private displayMinCharacterMessage(visibility: boolean): void {
        if (visibility) {
            this.classList.add('char-restriction');
        } else {
            this.classList.remove('char-restriction');
        }
    }

    private addListEntry(className: string, content: string): void {
        if (!this.listElement) return;
        const newEntry = document.createElement('li');
        newEntry.classList.add(className);
        newEntry.classList.add('m-list-option');

        const newEntryContent = document.createElement('div');
        newEntryContent.innerHTML = content;

        newEntry.appendChild(newEntryContent);
        this.listElement.appendChild(newEntry);
    }

    private onClick(e: Event): void {
        e.preventDefault();
        e.stopPropagation();

        const clickedElement = e.target as HTMLElement;
        const listItem = clickedElement.closest('li');

        if (!listItem) {
            return;
        }

        this.setSelectedOption(listItem);
    }

    private setSelectedOptionByIndex(): void {
        const listItem = this.visibleList[this.listHighlightedIndex];

        if (listItem?.dataset.readonly === 'true') {
            return;
        }

        if (typeof listItem === 'undefined') {
            return;
        }

        this.setSelectedOption(listItem);
        this.updateScrollPosition();
    }

    private setSelectedOption(
        option: HTMLLIElement,
        preserveFilter = false,
    ): void {
        this.clearSelectedOptions();
        this.setOption(option);

        this.suppressClickEventPropagation = preserveFilter;
        try {
            this.setValue(option);
        } finally {
            this.suppressClickEventPropagation = false;
        }

        if (!preserveFilter) this.clearFilteredOptions();
    }

    protected restoreSelection(): void {
        if (!this.element) return;

        const listItem =
            (this.querySelector(
                '[data-value="' + this.element.value + '"]',
            ) as HTMLElement) ??
            (this.querySelector('[data-selected="true"]') as HTMLElement);

        if (listItem === null) {
            this.clearSelectedOptions();
            return;
        }

        // clearSelectedOptions is called to handle an edge case that should not
        // be experienced in production: where the list is supplied with a selected
        // entry AND a value is supplied in the hidden input field
        this.clearSelectedOptions();

        this.setOption(listItem);
        this.setValue(listItem);
        this.setLabel(listItem);
    }

    protected restoreClearedValue(): void {
        if (!this.element) return;
        this.restoreSelection();
    }

    private clearFilteredOptions(): void {
        const filteredOptions = this.querySelectorAll(
            '.hidden-filter',
        ) as NodeListOf<HTMLElement>;

        filteredOptions.forEach((option) => {
            option.classList.remove('hidden-filter');
        });

        this.buildVisibleList();
    }

    private clearExternallyFilteredOptions(): void {
        const filteredOptions = this.querySelectorAll(
            '.hidden-external-filter',
        ) as NodeListOf<HTMLElement>;

        filteredOptions.forEach((option) => {
            option.classList.remove('hidden-external-filter');
        });

        this.buildVisibleList();
    }

    private clearSelectedOptions(): void {
        this.listSelectedIndex = -1;
        const selectedOptions = this.querySelectorAll(
            '[data-selected="true"]',
        ) as NodeListOf<HTMLElement>;

        selectedOptions.forEach((option) => {
            this.clearOption(option);
        });
    }

    private clearOption(option: HTMLElement): void {
        option.dataset.selected = 'false';
        option.ariaSelected = 'false';
    }

    private setOption(option: HTMLElement): void {
        const optionPosition = option.dataset.position ?? '0';
        this.listSelectedIndex = Number(optionPosition);
        option.dataset.selected = 'true';
        option.ariaSelected = 'true';
    }

    private setHighlightedOptionFromMouse(e: Event): void {
        const target = e.target as HTMLLIElement;
        if (!target?.dataset.position) return;

        this.setHighlightedOption(target);
    }

    private setHighlightedOption(option: HTMLLIElement): void {
        this.visibleList[this.listSelectedIndex]?.classList.remove('highlight');
        this.visibleList[this.listHighlightedIndex]?.classList.remove(
            'highlight',
        );
        option.classList.add('highlight');
        this.listHighlightedIndex = Number(option.dataset.visiblePosition);
    }

    private clearHighlightedOption(): void {
        const currentHighlightedOption = this.querySelector('.highlight');
        if (!currentHighlightedOption) return;
        this.listHighlightedIndex = -1;

        currentHighlightedOption.classList.remove('highlight');
    }

    private resetHighlightedOption(): void {
        if (this.listSelectedIndex === -1) {
            this.clearHighlightedOption();
            return;
        }
        this.setHighlightedOption(this.list[this.listSelectedIndex]);
    }

    private setValue(option: HTMLElement): void {
        if (!this.element) return;
        if (this.element.value === option.dataset.value) {
            this.sendClickEvent();
            return;
        }

        this.element.value = `${option.dataset.value}`;
        this.element.placeholder = '';
        this.broadcastChange();
    }

    private clearLabel(): void {
        this.dataset.label = '';
        this.broadcastLabelChange();
    }

    private sendClickEvent(): void {
        if (this.suppressClickEventPropagation) return;

        const clickEvent = new CustomEvent('clickEvent', {
            bubbles: true,
            detail: this,
        });
        this.dispatchEvent(clickEvent);
    }

    private setLabel(option: HTMLElement): void {
        // retrieve the string using textContent - do not use innerText
        // as this will not retrieve values from items that are hidden
        let label = option.textContent;

        // parse out certain non-printing characters that have been observed
        label = label.replace(/\s\s+/g, ' ');

        // trim leading/trailing spaces
        label = label.trim();

        // store the cleaned label to the data-label property
        this.dataset.label = label;

        // inform a combobox/droplist that a label change needs to occur
        this.broadcastLabelChange();
    }

    private broadcastLabelChange(): void {
        const labelChange = new CustomEvent('labelChange', {
            bubbles: true,
            detail: this,
        });
        this.dispatchEvent(labelChange);
    }

    private processFilter(e: CustomEvent): void {
        let excluded = false;
        const matchingElement = this.querySelector(
            `[data-value="${e.detail.element.dataset.value}"]:not(.hidden-external-filter)`,
        ) as HTMLElement;

        // the incoming value has been found in the exclusion list
        if (
            e.detail.element.dataset.value &&
            this.properties.filter &&
            this.properties.filter.exclusions.indexOf(
                e.detail.element.dataset.value,
            ) >= 0
        ) {
            excluded = true;
        }

        if (matchingElement === null || excluded) {
            this.showOption(null, e.detail.hideMethod);
        } else {
            if (e.detail.visibility === 'visible') {
                this.showOption(
                    e.detail.element.dataset.value,
                    e.detail.hideMethod,
                );
            } else {
                this.clearExternallyFilteredOptions();
                this.hideOption(matchingElement, e.detail.hideMethod);
                this.buildVisibleList();
            }
        }
    }

    private hideOption(option: HTMLElement, hideMethod: string): void {
        if (option.dataset.selected === 'true') {
            this.clearOption(option);
            this.clearElementValue();
            this.clearLabel();
        }

        if (hideMethod === 'filter') {
            option.classList.add('hidden-external-filter');
        } else {
            option.classList.add('hidden-rule');
        }
    }

    private showOption(itemValue: string | null, hideMethod: string): void {
        let option;

        if (itemValue === null) {
            option = this.querySelector('.hidden-filter');
        } else {
            option = this.querySelector(
                "[value='" + itemValue + "'], [data-value='" + itemValue + "']",
            );
        }

        if (option === null) {
            return;
        }

        if (hideMethod === 'filter') {
            option.classList.remove('hidden-filter');
        } else {
            option.classList.remove('hidden-rule');
        }
    }

    private setInitialListHeight(): void {
        if (!this.listElement) return;

        const lineHeight = 33;
        const padding = 8;

        this.initialHeight =
            padding * 2 + lineHeight * this.properties.listsize;
        this.listElement.style.maxHeight = `${this.initialHeight}px`;
    }

    private setFilterMethod(): void {
        if (!this.properties.jumptofirstletter) return;
        this.properties.filtertype = 'jump';
    }

    private removeTabIndex(): void {
        this.tabIndex = -1;
    }

    private setListElement(): void {
        this.listElement = this.querySelector('ul');
    }

    private addVisibilityObserver(): void {
        if (!this.control) return;
        this.updatePosition(document);

        // Options for the observer (which mutations to observe)
        const config = {
            attributeFilter: ['style', 'class'],
        };

        let wasFocused = this.control.classList.contains('focus');

        const mutationObserver = (): void => {
            const isFocused =
                this.control?.classList.contains('focus') ?? false;
            const reopened = !wasFocused && isFocused;
            wasFocused = isFocused;

            requestAnimationFrame(() => {
                this.setDropListDirection();
                this.schedulePositionUpdate(document);

                if (
                    reopened &&
                    this.isConnected &&
                    this.control?.classList.contains('focus')
                ) {
                    this.updateScrollPosition();
                }
            });
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(mutationObserver);

        // Start observing the target node for configured mutations
        observer.observe(this.control, config);
    }

    private setDropListDirection(allowDownwardReset = false): void {
        if (!this.listElement || !this.control) return;

        const visualViewport = window.visualViewport;
        const viewportTop = 0;
        const viewportBottom = visualViewport?.height ?? window.innerHeight;
        const controlRect = this.control.getBoundingClientRect();

        this.listElement.style.maxHeight = `${this.initialHeight}px`;

        const measuredListHeight = this.listElement.scrollHeight;
        const listHasContent = this.visibleList.length > 0;
        const fullListHeight =
            measuredListHeight > 0 || !listHasContent
                ? measuredListHeight
                : this.initialHeight;
        const listHeight = Math.min(fullListHeight, this.initialHeight);

        const footerRect = document
            .querySelector('footer')
            ?.getBoundingClientRect();
        const lowerBoundary =
            footerRect && footerRect.top > controlRect.bottom
                ? Math.min(viewportBottom, footerRect.top)
                : viewportBottom;

        const spaceAbove = Math.max(0, controlRect.top - viewportTop);
        const spaceBelow = Math.max(0, lowerBoundary - controlRect.bottom);
        const opensUp = this.classList.contains('direction-up');

        // Prevent jitter when the available space above and below is nearly equal.
        const switchThreshold = this.controlHeight;

        // flag indicating final direction decision.
        let shouldOpenUp: boolean;

        if (opensUp) {
            const listNowFitsBelow = listHeight <= spaceBelow;
            const belowIsClearlyBetter =
                spaceBelow > spaceAbove + switchThreshold;

            shouldOpenUp =
                !(allowDownwardReset && listNowFitsBelow) &&
                !belowIsClearlyBetter &&
                (spaceAbove >= spaceBelow || spaceBelow < listHeight);
        } else {
            const aboveIsClearlyBetter =
                spaceAbove > spaceBelow + switchThreshold;
            const listDoesNotFitBelow = spaceBelow < listHeight;

            shouldOpenUp = aboveIsClearlyBetter && listDoesNotFitBelow;
        }

        this.classList.toggle('direction-up', shouldOpenUp);

        const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow;

        if (listHeight > availableSpace) {
            this.listElement.style.maxHeight = `${availableSpace}px`;
        }

        // Final position update after class/max-height changes have affected layout
        this.schedulePositionUpdate(document);
    }
}
