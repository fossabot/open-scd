import {
  LitElement,
  TemplateResult,
  css,
  customElement,
  html,
  property,
  query,
} from 'lit-element';
import { get, translate } from 'lit-translate';

import {
  Wizard,
  WizardAction,
  WizardInput,
  CloseableElement,
  EditorAction,
  newWizardEvent,
  newActionEvent,
  getValue,
} from '../../foundation.js';

import { startMove, styles } from './foundation.js';
import './conducting-equipment-editor.js';
import { ConductingEquipmentEditor } from './conducting-equipment-editor.js';
import { editlNode } from './lnodewizard.js';
import { VoltageLevelEditor } from './voltage-level-editor.js';

interface BayUpdateOptions {
  element: Element;
}
interface BayCreateOptions {
  parent: Element;
}
type BayWizardOptions = BayUpdateOptions | BayCreateOptions;
function isBayCreateOptions(
  options: BayWizardOptions
): options is BayCreateOptions {
  return (<BayCreateOptions>options).parent !== undefined;
}

/** [[`SubstationEditor`]] subeditor for a `Bay` element. */
@customElement('bay-editor')
export class BayEditor extends LitElement {
  @property()
  element!: Element;

  @property({ type: String })
  get name(): string {
    return this.element.getAttribute('name') ?? '';
  }
  @property({ type: String })
  get desc(): string | null {
    return this.element.getAttribute('desc') ?? null;
  }

  @query('h3') header!: Element;
  @query('section') container!: Element;

  openEditWizard(): void {
    this.dispatchEvent(
      newWizardEvent(BayEditor.wizard({ element: this.element }))
    );
  }

  openConductingEquipmentWizard(): void {
    if (!this.element) return;
    const event = newWizardEvent(
      ConductingEquipmentEditor.wizard({ parent: this.element })
    );
    this.dispatchEvent(event);
  }

  openLNodeWizard(): void {
    this.dispatchEvent(newWizardEvent(editlNode(this.element)));
  }

  remove(): void {
    if (this.element)
      this.dispatchEvent(
        newActionEvent({
          old: {
            parent: this.element.parentElement!,
            element: this.element,
            reference: this.element.nextElementSibling,
          },
        })
      );
  }

  renderHeader(): TemplateResult {
    return html`<h3>
      ${this.name} ${this.desc === null ? '' : html`&mdash;`} ${this.desc}
      <mwc-icon-button
        icon="playlist_add"
        @click=${() => this.openConductingEquipmentWizard()}
      ></mwc-icon-button>
      <nav>
        <mwc-icon-button
          icon="account_tree"
          @click="${() => this.openLNodeWizard()}"
        ></mwc-icon-button>
        <mwc-icon-button
          icon="edit"
          @click=${() => this.openEditWizard()}
        ></mwc-icon-button>
        <mwc-icon-button
          icon="forward"
          @click=${() => startMove(this, BayEditor, VoltageLevelEditor)}
        ></mwc-icon-button>
        <mwc-icon-button
          icon="delete"
          @click=${() => this.remove()}
        ></mwc-icon-button>
      </nav>
    </h3>`;
  }

  render(): TemplateResult {
    return html`<section tabindex="0">
      ${this.renderHeader()}
      <div id="ceContainer">
        ${Array.from(
          this.element?.querySelectorAll(
            ':root > Substation > VoltageLevel > Bay > ConductingEquipment'
          ) ?? []
        ).map(
          voltageLevel =>
            html`<conducting-equipment-editor
              .element=${voltageLevel}
            ></conducting-equipment-editor>`
        )}
      </div>
    </section> `;
  }

  static createAction(parent: Element): WizardAction {
    return (
      inputs: WizardInput[],
      wizard: CloseableElement
    ): EditorAction[] => {
      const name = getValue(inputs.find(i => i.label === 'name')!);
      const desc = getValue(inputs.find(i => i.label === 'desc')!);

      const action = {
        new: {
          parent,
          element: new DOMParser().parseFromString(
            `<Bay
              name="${name}"
              ${desc === null ? '' : `desc="${desc}"`}
            ></Bay>`,
            'application/xml'
          ).documentElement,
          reference: null,
        },
      };

      wizard.close();
      return [action];
    };
  }

  static updateAction(element: Element): WizardAction {
    return (
      inputs: WizardInput[],
      wizard: CloseableElement
    ): EditorAction[] => {
      const name = getValue(inputs.find(i => i.label === 'name')!)!;
      const desc = getValue(inputs.find(i => i.label === 'desc')!);

      if (
        name === element.getAttribute('name') &&
        desc === element.getAttribute('desc')
      )
        return [];

      const newElement = <Element>element.cloneNode(false);
      newElement.setAttribute('name', name);
      if (desc === null) newElement.removeAttribute('desc');
      else newElement.setAttribute('desc', desc);
      wizard.close();

      return [{ old: { element }, new: { element: newElement } }];
    };
  }

  static wizard(options: BayWizardOptions): Wizard {
    const [
      heading,
      actionName,
      actionIcon,
      action,
      name,
      desc,
    ] = isBayCreateOptions(options)
      ? [
          get('bay.wizard.title.add'),
          get('add'),
          'add',
          BayEditor.createAction(options.parent),
          '',
          null,
        ]
      : [
          get('bay.wizard.title.edit'),
          get('save'),
          'edit',
          BayEditor.updateAction(options.element),
          options.element.getAttribute('name'),
          options.element.getAttribute('desc'),
        ];

    return [
      {
        title: heading,
        primary: {
          icon: actionIcon,
          label: actionName,
          action: action,
        },
        content: [
          html`<wizard-textfield
            label="name"
            .maybeValue=${name}
            helper="${translate('bay.wizard.nameHelper')}"
            iconTrailing="title"
            required
            validationMessage="${translate('textfield.required')}"
            dialogInitialFocus
          ></wizard-textfield>`,
          html`<wizard-textfield
            label="desc"
            .maybeValue=${desc}
            nullable="true"
            helper="${translate('bay.wizard.descHelper')}"
            iconTrailing="description"
          ></wizard-textfield>`,
        ],
      },
    ];
  }

  static styles = css`
    ${styles}

    section {
      margin: 0px;
    }

    #ceContainer {
      display: grid;
      grid-gap: 12px;
      padding: 12px;
      box-sizing: border-box;
      grid-template-columns: repeat(auto-fit, minmax(64px, auto));
    }
  `;
}
