// DEMO web component for Storybook introduction.
import WCExample from './web-components/wc-example';

// Import modules for web components.
import AButtonIcon from './web-components/a-button-icon';
import AButtonTerminator from './web-components/a-button-terminator';
import AScaleUnit from './web-components/a-scale-unit';
import MOptionButton from './web-components/m-option-button';
import MMultiline from './web-components/m-multiline';
import MSingleline from './web-components/m-singleline';
import MSinglelineNumber from './web-components/m-singleline-number';
import MSinglelineDate from './web-components/m-singleline-date';
import MSliderTrack from './web-components/m-slider-track';
import MOptionBase from './web-components/m-option-base';
import MOptionBoolean from './web-components/m-option-boolean';
import MOptionTab from './web-components/m-option-tab';
import OOptionBase from './web-components/o-option-base';
import OCombobox from './web-components/o-combobox';
import ODropdown from './web-components/o-dropdown';
import OOptionSublist from './web-components/o-option-sublist';
import OOptionTabStrip from './web-components/o-option-tabstrip';
import OQuestion from './web-components/o-question';
import OLoop from './web-components/o-loop';
import OResponse from './web-components/o-response';
import OScale from './web-components/o-scale';
import OScaleContainer from './web-components/m-scale-container';
import OSlider from './web-components/o-slider';
import OList from './web-components/o-list';
import AProperties from './web-components/a-properties';
import OMediaImage from './web-components/o-media-image';
import OPalette from './web-components/o-palette';
import OPaletteLoop from './web-components/o-palette-loop';
import OHistory from './web-components/o-history';
import OPaletteHistoryEntry from './web-components/o-palette-history-entry';
import AFTD from './web-components/a-ftd';

export const uiInit = (): void => {
    // DEMO web component for Storybook introduction.
    !customElements.get('wc-example') &&
        customElements.define('wc-example', WCExample);

    // Define custom elements in the client.
    // The order in which these elements are listed below is the order in which
    // the client will initialise the elements. It is therefore important to
    // consider the sequence of 'define' calls: i.e. inputs belong to a response
    // which belongs to a question and may require the question to be present.

    // Page level properties first
    !customElements.get('a-properties') &&
        customElements.define('a-properties', AProperties);

    // Outer containers.
    !customElements.get('o-question') &&
        customElements.define('o-question', OQuestion);
    !customElements.get('o-response') &&
        customElements.define('o-response', OResponse);
    !customElements.get('o-loop') && customElements.define('o-loop', OLoop);

    !customElements.get('o-option-sublist') &&
        customElements.define('o-option-sublist', OOptionSublist);
    !customElements.get('o-option-tabstrip') &&
        customElements.define('o-option-tabstrip', OOptionTabStrip);
    !customElements.get('o-combobox') &&
        customElements.define('o-combobox', OCombobox);
    !customElements.get('o-dropdown') &&
        customElements.define('o-dropdown', ODropdown);
    !customElements.get('o-scale') && customElements.define('o-scale', OScale);
    !customElements.get('o-scale-container') &&
        customElements.define('o-scale-container', OScaleContainer);
    !customElements.get('o-slider') &&
        customElements.define('o-slider', OSlider);
    !customElements.get('o-media-image') &&
        customElements.define('o-media-image', OMediaImage);

    !customElements.get('o-palette-loop') &&
        customElements.define('o-palette-loop', OPaletteLoop);
    !customElements.get('o-palette') &&
        customElements.define('o-palette', OPalette);
    !customElements.get('o-history') &&
        customElements.define('o-history', OHistory);
    !customElements.get('o-palette-history-entry') &&
        customElements.define('o-palette-history-entry', OPaletteHistoryEntry);
    !customElements.get('a-ftd') && customElements.define('a-ftd', AFTD);

    // Inner components.
    !customElements.get('a-scale-unit') &&
        customElements.define('a-scale-unit', AScaleUnit);
    !customElements.get('a-button-icon') &&
        customElements.define('a-button-icon', AButtonIcon);
    !customElements.get('a-button-terminator') &&
        customElements.define('a-button-terminator', AButtonTerminator);

    !customElements.get('m-option-button') &&
        customElements.define('m-option-button', MOptionButton);
    !customElements.get('m-multiline') &&
        customElements.define('m-multiline', MMultiline);
    !customElements.get('m-singleline') &&
        customElements.define('m-singleline', MSingleline);
    !customElements.get('m-singleline-number') &&
        customElements.define('m-singleline-number', MSinglelineNumber);
    !customElements.get('m-singleline-date') &&
        customElements.define('m-singleline-date', MSinglelineDate);
    !customElements.get('m-option-base') &&
        customElements.define('m-option-base', MOptionBase);
    !customElements.get('o-option-base') &&
        customElements.define('o-option-base', OOptionBase);
    !customElements.get('m-option-boolean') &&
        customElements.define('m-option-boolean', MOptionBoolean);
    !customElements.get('m-option-tab') &&
        customElements.define('m-option-tab', MOptionTab);
    !customElements.get('m-slider-track') &&
        customElements.define('m-slider-track', MSliderTrack);
    !customElements.get('o-list') && customElements.define('o-list', OList);
};
