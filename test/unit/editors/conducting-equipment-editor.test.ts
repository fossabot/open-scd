import { fixture, html, expect } from '@open-wc/testing';

import { ConductingEquipmentEditor } from '../../../src/editors/substation/conducting-equipment-editor.js';
import { getDocument } from '../../data.js';

describe('conducting-equipment-editor', () => {
  let element: ConductingEquipmentEditor;
  const validSCL = getDocument();
  beforeEach(async () => {
    element = <ConductingEquipmentEditor>(
      await fixture(
        html`<conducting-equipment-editor
          .element=${validSCL.querySelector('ConductingEquipment')}
          .parent=${validSCL.querySelector('Bay')}
        ></conducting-equipment-editor>`
      )
    );
  });

  it('has a name property', () =>
    expect(element).to.have.property('name', 'QA1'));

  it('has a desc property', () =>
    expect(element).to.have.property('desc', 'coupling field ciscuit breaker'));

  it('renders header with name visible', () => {
    expect(element).property('header').to.contain.text('QA1');
  });
});
