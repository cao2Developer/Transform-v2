import VisibilityRulesProcessor from './visibility-rules-processor';

interface FtdVariable {
    value: string | null;
    label: string | null;
}

interface VisibilityRule {
    rules: string;
    collapse?: boolean;
}

interface FtdProperties {
    visible?: VisibilityRule;
    invisible?: VisibilityRule;
}

export default class FtdRenderer {
    private visibilityRulesProcessor = new VisibilityRulesProcessor();

    public render(
        root: ParentNode,
        valueScope: ParentNode | null,
        getVariable: (associateControl: string) => FtdVariable,
        parseProperties?: (element: HTMLElement) => object,
    ): void {
        root.querySelectorAll('ftd-rule').forEach((rule) => {
            this.processVisibility(
                rule as HTMLElement,
                valueScope,
                parseProperties,
            );

            if (rule.getAttribute('type') !== 'variable') return;

            const associateControl = rule.getAttribute(
                'data-associate-control',
            );
            if (!associateControl) return;

            const variable = getVariable(associateControl);
            rule.textContent = variable.label || variable.value || '';
        });
    }

    private processVisibility(
        rule: HTMLElement,
        valueScope: ParentNode | null,
        parseProperties?: (element: HTMLElement) => object,
    ): void {
        rule.classList.remove('unavailable', 'do-not-collapse');

        if (!valueScope) return;

        const properties = parseProperties
            ? parseProperties(rule)
            : this.parseProperties(rule);
        const parsed = Object.keys(properties).length
            ? (properties as FtdProperties)
            : this.getVisibilityRules(rule.getAttribute('data-properties'));
        const visibleRule = parsed.visible?.rules ?? '';
        const invisibleRule = parsed.invisible?.rules ?? '';
        if (!visibleRule && !invisibleRule) return;

        let available = true;
        let collapse = true;

        if (visibleRule) {
            const parsedRule =
                this.visibilityRulesProcessor.parseVisibilityRules(visibleRule);
            this.visibilityRulesProcessor.getQuestionValues(valueScope);
            available = this.visibilityRulesProcessor.evaluateRule(
                this.visibilityRulesProcessor.insertQuestionValuesIntoRule(
                    parsedRule,
                ),
            );
            collapse = parsed.visible?.collapse ?? true;
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
            collapse = parsed.invisible?.collapse ?? collapse;
        }

        if (!available) {
            rule.classList.add('unavailable');
            if (!collapse) rule.classList.add('do-not-collapse');
        }
    }

    private parseProperties(element: HTMLElement): object {
        const properties = element.getAttribute('data-properties');
        if (!properties) return {};

        try {
            return JSON.parse(properties.replace(/&quot;/g, '"')) as object;
        } catch {
            return {};
        }
    }

    private getVisibilityRules(properties: string | null): FtdProperties {
        if (!properties) return {};

        const result: FtdProperties = {};
        const pattern =
            /"(visible|invisible)"\s*:\s*\{[^}]*"rules"\s*:\s*"([^"]+)"[^}]*?(?:"collapse"\s*:\s*(true|false))?[^}]*\}/g;
        let match = pattern.exec(properties);

        while (match) {
            result[match[1] as 'visible' | 'invisible'] = {
                rules: match[2],
                collapse: match[3] === undefined ? true : match[3] === 'true',
            };
            match = pattern.exec(properties);
        }

        return result;
    }
}
