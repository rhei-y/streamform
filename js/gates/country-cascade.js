/**
 * country-cascade gate -- Demo 2
 *
 * When country changes: repopulate state dropdown,
 * update postal placeholder/mask, recalculate tax.
 * All in one transform. One gate. Zero intermediate states.
 */
import { Gate } from '../core/Gate.js';

// --- Static data ---

const STATES = {
  US: [
    ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
    ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
    ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
    ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
    ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
    ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
    ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
    ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
    ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
    ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
    ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
    ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
    ['WI','Wisconsin'],['WY','Wyoming'],
  ],
  CA: [
    ['AB','Alberta'],['BC','British Columbia'],['MB','Manitoba'],
    ['NB','New Brunswick'],['NL','Newfoundland and Labrador'],
    ['NS','Nova Scotia'],['NT','Northwest Territories'],['NU','Nunavut'],
    ['ON','Ontario'],['PE','Prince Edward Island'],['QC','Quebec'],
    ['SK','Saskatchewan'],['YT','Yukon'],
  ],
  GB: [
    ['ENG','England'],['SCT','Scotland'],['WLS','Wales'],['NIR','Northern Ireland'],
  ],
  AU: [
    ['ACT','Australian Capital Territory'],['NSW','New South Wales'],
    ['NT','Northern Territory'],['QLD','Queensland'],['SA','South Australia'],
    ['TAS','Tasmania'],['VIC','Victoria'],['WA','Western Australia'],
  ],
  DE: [
    ['BW','Baden-Wurttemberg'],['BY','Bavaria'],['BE','Berlin'],
    ['BB','Brandenburg'],['HB','Bremen'],['HH','Hamburg'],['HE','Hesse'],
    ['NI','Lower Saxony'],['MV','Mecklenburg-Vorpommern'],['NW','North Rhine-Westphalia'],
    ['RP','Rhineland-Palatinate'],['SL','Saarland'],['SN','Saxony'],
    ['ST','Saxony-Anhalt'],['SH','Schleswig-Holstein'],['TH','Thuringia'],
  ],
  JP: [
    ['13','Tokyo'],['27','Osaka'],['14','Kanagawa'],['23','Aichi'],
    ['01','Hokkaido'],['40','Fukuoka'],['04','Miyagi'],['34','Hiroshima'],
  ],
  IN: [
    // States
    ['AP','Andhra Pradesh'],['AR','Arunachal Pradesh'],['AS','Assam'],
    ['BR','Bihar'],['CG','Chhattisgarh'],['GA','Goa'],['GJ','Gujarat'],
    ['HR','Haryana'],['HP','Himachal Pradesh'],['JH','Jharkhand'],
    ['KA','Karnataka'],['KL','Kerala'],['MP','Madhya Pradesh'],
    ['MH','Maharashtra'],['MN','Manipur'],['ML','Meghalaya'],
    ['MZ','Mizoram'],['NL','Nagaland'],['OD','Odisha'],['PB','Punjab'],
    ['RJ','Rajasthan'],['SK','Sikkim'],['TN','Tamil Nadu'],
    ['TG','Telangana'],['TR','Tripura'],['UP','Uttar Pradesh'],
    ['UK','Uttarakhand'],['WB','West Bengal'],
    // Union Territories
    ['AN','Andaman and Nicobar Islands'],['CH','Chandigarh'],
    ['DD','Dadra and Nagar Haveli and Daman and Diu'],['DL','Delhi'],
    ['JK','Jammu and Kashmir'],['LA','Ladakh'],
    ['LD','Lakshadweep'],['PY','Puducherry'],
  ],
};

const POSTAL_CONFIG = {
  US: { placeholder: '12345',      label: 'ZIP Code' },
  CA: { placeholder: 'A1A 1A1',    label: 'Postal Code' },
  GB: { placeholder: 'SW1A 1AA',   label: 'Postcode' },
  AU: { placeholder: '2000',       label: 'Postcode' },
  DE: { placeholder: '10115',      label: 'Postleitzahl' },
  JP: { placeholder: '100-0001',   label: 'Postal Code' },
  IN: { placeholder: '110001',     label: 'PIN Code' },
};

const TAX_RATES = {
  US: 0.08,
  CA: 0.13,
  GB: 0.20,
  AU: 0.10,
  DE: 0.19,
  JP: 0.10,
  IN: 0.18,
};

const SUBTOTAL = 100.00;

export class CountryCascadeGate extends Gate {
  constructor() {
    super('country-changed');
  }

  transform(event, stream) {
    const { prefix, country } = event.data;
    if (!prefix || !country) return;

    // 1. Repopulate state dropdown
    const stateSelect = document.getElementById(`${prefix}-state`);
    if (stateSelect) {
      const states = STATES[country] || [];
      stateSelect.innerHTML = '<option value="">Select...</option>';
      for (const [code, name] of states) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = name;
        stateSelect.appendChild(opt);
      }
      // Apply pre-selected state if carried by the event (e.g. from copy-billing).
      // Doing this here -- inside the same transform that repopulated the options --
      // eliminates any reliance on dispatch order.
      if (event.data.selectState) {
        stateSelect.value = event.data.selectState;
      }
    }

    // 2. Update postal placeholder and label
    const postalInput = document.getElementById(`${prefix}-postal`);
    const postalLabel = postalInput
      ? postalInput.closest('.field-group')?.querySelector('.field-label')
      : null;
    const postalConfig = POSTAL_CONFIG[country] || POSTAL_CONFIG.US;
    if (postalInput) {
      postalInput.placeholder = postalConfig.placeholder;
      postalInput.value = ''; // Clear since format changed
    }
    if (postalLabel) {
      // Preserve the "required" class and any demo badges
      const badge = postalLabel.querySelector('.demo-badge');
      const isRequired = postalLabel.classList.contains('field-label-required');
      postalLabel.textContent = postalConfig.label + ' ';
      if (isRequired) postalLabel.classList.add('field-label-required');
      if (badge) postalLabel.appendChild(badge);
    }

    // 3. Recalculate tax (use billing country for tax)
    if (prefix === 'billing' || prefix === 'shipping') {
      const billingCountry = document.getElementById('billing-country')?.value || 'US';
      const rate = TAX_RATES[billingCountry] || 0;
      const taxAmount = SUBTOTAL * rate;
      const total = SUBTOTAL + taxAmount;

      const rateLabel = document.getElementById('tax-rate-label');
      const amountEl = document.getElementById('tax-amount');
      const totalEl = document.getElementById('tax-total');

      if (rateLabel) rateLabel.textContent = `${(rate * 100).toFixed(0)}%`;
      if (amountEl) amountEl.textContent = `$${taxAmount.toFixed(2)}`;
      if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }
  }
}

// Export data for tests
export { STATES, POSTAL_CONFIG, TAX_RATES, SUBTOTAL };
