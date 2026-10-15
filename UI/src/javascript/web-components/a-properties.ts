import Component from './component';
import { JsonObject } from './util';

interface FocusProperties extends JsonObject {
    control: boolean;
    question: boolean;
}

interface CustomProperties extends JsonObject {
    debug: boolean;
    floatdetails: boolean;
    focus: FocusProperties;
    jumptoerror: boolean;
    paste: boolean;
    separator: boolean;
    sidebyside: number;
    tab: string;
    validate: boolean;
    resettonull: boolean;
}

/** This component should not broadcast events as it is initialised before
 * any other components on the page
 */

export default class AProperties extends Component {
    public properties: CustomProperties = {
        debug: false,
        floatdetails: true,
        focus: {
            control: true,
            question: true,
        },
        jumptoerror: true,
        paste: false,
        separator: true,
        sidebyside: 30,
        tab: '',
        validate: false,
        resettonull: true,
    };

    private setDebugMode(): void {
        if (!this.properties.debug) return;
        document.body.classList.add('debug');

        this.makePropertiesVisible();
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private makePropertiesVisible(): void {
        const elements =
            document.querySelectorAll<HTMLElement>('[data-properties]');

        elements.forEach((element) => {
            if (
                element.previousElementSibling?.classList.contains(
                    'a-properties-debug',
                )
            ) {
                return;
            }

            let properties = element.dataset.properties ?? '{}';
            properties = properties.replace(/&apos;/g, "'");

            let formattedProperties;

            try {
                const parsed = JSON.parse(properties);
                formattedProperties = JSON.stringify(parsed, null, 2);
            } catch {
                formattedProperties = properties;
            }

            const propertiesContainer = document.createElement('div');
            propertiesContainer.className = 'a-properties-debug';

            const pre = document.createElement('pre');
            const escaped = this.escapeHtml(formattedProperties);
            pre.innerHTML = escaped.replace(
                /("rules"\s*:\s*(?:"(?:\\.|[^"\\])*"|[^,\n]+))/g,
                '<span class="a-properties-rule">$1</span>',
            );
            propertiesContainer.appendChild(pre);

            if (element.parentElement) {
                element.insertAdjacentElement(
                    'beforebegin',
                    propertiesContainer,
                );
            } else {
                element.appendChild(propertiesContainer);
            }
        });
    }

    private setFloatDetailsStyle(): void {
        if (this.properties.floatdetails) return;
        document.body.classList.add('details-inline');
    }

    private setFocusOnControlStyle(): void {
        if (!this.properties.focus?.control) return;
        document.body.classList.add('focus-control');
    }

    private setFocusOnQuestionStyle(): void {
        if (!this.properties.focus?.question) return;
        document.body.classList.add('focus-question');
    }

    private jumpToErrorMessage(): void {
        if (!this.properties.jumptoerror) return;

        const firstError: HTMLElement | null =
            document.querySelector('.a-label-error');
        if (!firstError) return;

        const itemWithError = firstError.dataset.questionId;

        const errorElement = itemWithError
            ? document.getElementById(itemWithError)
            : null;

        if (!errorElement) {
            // If no error element is found, scroll to the first error message.
            firstError.scrollIntoView({ block: 'center' });
        } else {
            // Scroll to the error element and focus on it.
            errorElement.scrollIntoView({ block: 'center' });
            errorElement.focus();
        }
    }

    private setPastePermissions(): void {
        document.body.dataset.paste = this.properties.paste ? 'true' : 'false';
    }

    private setSeparatorStyle(): void {
        if (this.properties.separator) return;
        document.body.classList.add('question-no-separator');
    }

    private setSideBySideWidth(): void {
        if (!this.properties.sidebyside) return;

        document.documentElement.style.setProperty(
            '--column1-width',
            `${this.properties.sidebyside}%`,
        );
    }

    private setCurrentTab(): void {
        if (!this.properties.tab) return;
        document.body.dataset.currentTab = this.properties.tab;
    }

    private setValidateFormAttribute(): void {
        if (this.properties.validate) return;
        const form = this.closest('form');
        if (!form) return;
        form.setAttribute('novalidate', 'true');
    }

    private setQuestionRestoreBehaviour(): void {
        document.body.dataset.restoreInitialQuestionValues = `${!this.properties.resettonull}`;
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.setDebugMode();
        this.setFloatDetailsStyle();
        this.setFocusOnControlStyle();
        this.setFocusOnQuestionStyle();
        this.setPastePermissions();
        this.setSeparatorStyle();
        this.setSideBySideWidth();
        this.setQuestionRestoreBehaviour();
        this.setCurrentTab();
        this.setValidateFormAttribute();
        this.jumpToErrorMessage();
    }
}
