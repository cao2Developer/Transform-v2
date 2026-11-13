import { uiInit } from '../../src/javascript/ui-init';

uiInit();

export const PaletteBlockHtml = (options?: { order?: string }): string => `
<o-block>
    <o-palette>
        <div class="palette-empty">
            <a-button-icon class="complexbutton-add" data-translate="add-button"></a-button-icon>
        </div>
        <div class="palette-complete">
            <div class="m-message-information" data-translate="palette-complete"></div>
        </div>
        <div class="palette-inprogress">
            <style>
                .palette-inprogress {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: auto auto auto;
                    column-gap: 16px;
                    row-gap: 8px;
                }
                .label-cbDrugTest { grid-column: 1; grid-row: 1; }
                .label-otherdrug { grid-column: 1; grid-row: 2; }
                .control-cbDrugTest { grid-column: 2; grid-row: 1; }
                .control-otherdrug { grid-column: 2; grid-row: 2; }
                .palette-button-row {
                    grid-column: 2;
                    grid-row: 3;
                    justify-self: end;
                    display: grid;
                    grid-auto-flow: column;
                    gap: 12px;
                }
            </style>
            <div class="label-cbDrugTest" data-associate-type="label" data-associate-question="cb__drugtest"></div>
            <div class="control-cbDrugTest" data-associate-type="control" data-associate-question="cb__drugtest"></div>
            <div class="label-otherdrug" data-associate-type="label" data-associate-question="otherdrug"></div>
            <div class="control-otherdrug" data-associate-type="control" data-associate-question="otherdrug"></div>
            <div class="palette-button-row">
                <a-button-icon class="complexbutton-cancel"></a-button-icon>
                <a-button-icon class="complexbutton-submit"></a-button-icon>
            </div>
        </div>
    </o-palette>
    <o-history${options?.order ? ` data-order="${options.order}"` : ''}>
        <template class="l-row-template">
            <div class="l-col-history-ftd">
                <ftd data-name="historyentry">
                    <ftd-rule type="variable" data-associate-control="cb__drugtest"></ftd-rule>
                    <ftd-rule type="span" data-properties="{&quot;visible&quot;:{&quot;collapse&quot;:true,&quot;rules&quot;:&quot;cb__drugtest.containsAny('__1__7126__7126','__1__5020__5020')&quot;}}">
                        <ftd-rule type="static" data-translate="other"><span>: </span></ftd-rule>
                        <ftd-rule type="variable" data-associate-control="otherdrug"></ftd-rule>
                    </ftd-rule>
                </ftd>
            </div>
            <div class="l-col-history">
                <a-button-icon class="complexquestion-edit"></a-button-icon>
                <a-button-icon class="complexquestion-delete"></a-button-icon>
            </div>
        </template>
        <div class="history-empty"><span class="a-label-history" data-translate="history-empty"></span></div>
        <div class="history-inprogress">
            <div class="l-row-header"><div class="l-col"><span class="a-label-question" data-associate-question="triggerword" data-associate-type="label"></span></div></div>
            <div class="l-row-history"></div>
        </div>
    </o-history>

    <o-question data-global="false" hidden="hidden">
        <label for="_Q2" class="a-label-question" style="">Drug name</label>
        <o-response data-bgcolor="combobox" data-has-container="true"
                    data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qcb__drugtest"
                    data-associate-question="cb__drugtest"
                    data-properties="{&quot;listsize&quot;:10,&quot;mincharactersforlist&quot;:0,&quot;notenoughcharacters&quot;:&quot;&quot;,&quot;filtertype&quot;:&quot;starts&quot;,&quot;placeholder&quot;:&quot;&quot;,&quot;otherquestion&quot;:null,&quot;noitemsinlist&quot;:&quot;no items match this filter&quot;}"
                    data-position="below">
            <o-combobox
                data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qcb__drugtest"
                data-question-id="_Q2" class="o-select-custom">
                <input id="_Q2_control" type="text" class="a-input-combobox" autocomplete="off"
                       placeholder="select an option" />
                <o-list
                    data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qcb__drugtest"
                    data-question-id="_Q2_list" tabindex="0" id="_Q2_list_list">
                    <ul class="o-list">
                        <li id="_Q2_C0" class="m-list-option" data-value="__3__7674__7674"><div><span class="a-icon-multistate" data-icon-type="listitem"><!--Icon--></span><span class="a-label-option">177Lu-PSMA-617</span></div></li>
                        <li id="_Q2_C1" class="m-list-option" data-value="__3__0002__0002"><div><span class="a-icon-multistate" data-icon-type="listitem"><!--Icon--></span><span class="a-label-option">5-FU</span></div></li>
                        <li id="_Q2_C2" class="m-list-option" data-value="__3__0004__0004"><div><span class="a-icon-multistate" data-icon-type="listitem"><!--Icon--></span><span class="a-label-option">6-Mercaptopurine</span></div></li>
                        <li id="_Q2_C3" class="m-list-option" data-value="__3__0006__0006"><div><span class="a-icon-multistate" data-icon-type="listitem"><!--Icon--></span><span class="a-label-option">6-Thioguanine</span></div></li>
                        <li id="_Q2_C1025" class="m-list-option" data-value="__1__7126__7126"><div><span class="a-icon-multistate" data-icon-type="listitem"><!--Icon--></span><span class="a-label-option">Other Non-Hormonal (SPECIFY)</span></div></li>
                        <li id="_Q2_C1026" class="m-list-option" data-value="__1__5020__5020"><div><span class="a-icon-multistate" data-icon-type="listitem"><!--Icon--></span><span class="a-label-option">Other Hormonal (SPECIFY)</span></div></li>
                    </ul>
                    <input data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qcb__drugtest"
                           name="_Q_DDynamicPage_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qcb__drugtest_C"
                           data-xmlNode="Question/Control" data-hidden="true" autocomplete="off" id="_Q2"
                           type="hidden" max="1" style="text-align:left;" value=""
                           placeholder="select an option" />
                </o-list>
            </o-combobox>
        </o-response>
    </o-question>
    <o-question data-global="false" hidden="hidden">
        <label for="_Q3" class="a-label-question" style="">Other name</label>
        <o-response data-bgcolor="singleline" data-has-container="true"
                    data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qotherdrug"
                    data-associate-question="otherdrug"
                    data-properties="{&quot;visible&quot;:{&quot;collapse&quot;:false,&quot;rules&quot;:&quot;FormComboAndOtherJustABlock_Qcb__drugtest.containsAny('__1__1128__1128','__1__7126__7126','__1__5020__5020')&quot;}}"
                    data-position="below">
            <m-singleline
                data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qotherdrug"
                data-question-id="_Q3">
                <span class="a-label-pre-boxed"><!--pre label-boxed--></span>
                <input data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qotherdrug"
                       name="_Q_DDynamicPage_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_Qotherdrug"
                       value="" data-xmlNode="Question/Control" data-hidden="false" autocomplete="off" id="_Q3"
                       type="text" class="a-singleline" maxlength="100" style="text-align:left;" />
                <span class="a-label-post-boxed"><!--post label-boxed--></span>
            </m-singleline>
        </o-response>
    </o-question>
    <o-question data-global="false" hidden="hidden">
        <o-response data-associate-question="Storage">
            <o-palette-loop>
                <table class="o-structure-table">
                    <thead><tr class="m-structure-row-heading"><th scope="col">Which Drug</th><th scope="col">Other drug (specified)</th></tr></thead>
                    <tbody>
                        <tr class="m-structure-row"><td><o-question><o-response data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__1_Qcb__drugtest" data-associate-question="cb__drugtest"><input id="_Q4_Q0_Q0" data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__1_Qcb__drugtest" type="text" /></o-response></o-question></td><td><o-question><o-response data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__1_Qotherdrug" data-associate-question="otherdrug"><input id="_Q4_Q0_Q1" data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__1_Qotherdrug" type="text" /></o-response></o-question></td></tr>
                        <tr class="m-structure-row"><td><o-question><o-response data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__2_Qcb__drugtest" data-associate-question="cb__drugtest"><input id="_Q4_Q1_Q0" data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__2_Qcb__drugtest" type="text" /></o-response></o-question></td><td><o-question><o-response data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__2_Qotherdrug" data-associate-question="otherdrug"><input id="_Q4_Q1_Q1" data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__2_Qotherdrug" type="text" /></o-response></o-question></td></tr>
                        <tr class="m-structure-row"><td><o-question><o-response data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__3_Qcb__drugtest" data-associate-question="cb__drugtest"><input id="_Q4_Q2_Q0" data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__3_Qcb__drugtest" type="text" /></o-response></o-question></td><td><o-question><o-response data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__3_Qotherdrug" data-associate-question="otherdrug"><input id="_Q4_Q2_Q1" data-question-group="_QFormComboAndOtherJustABlockPage_QFormComboAndOtherJustABlock_QStorage_Q__3_Qotherdrug" type="text" /></o-response></o-question></td></tr>
                    </tbody>
                </table>
            </o-palette-loop>
        </o-response>
    </o-question>
</o-block>`;

export const PaletteHistoryEntryHtml = (): string =>
    PaletteBlockHtml().replace(
        '<div class="l-row-history"></div>',
        `<div class="l-row-history">
            <o-palette-history-entry data-index="0" data-cb__drugtest="Aspirin" data-otherdrug=""></o-palette-history-entry>
        </div>`,
    );

export const PalettePageHtml = (): string => `
<main class="surroundcontent">
    ${PaletteBlockHtml()}
</main>`;
