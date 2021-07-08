import { Component, h, Listen, Prop, State } from '@stencil/core';
import { qrcode, svg2url } from 'pure-svg-code';
import {
  PANDEMIC_TRACKING_URL,
  PANDEMIC_TRACKING_IS_ENABLED,
} from '../../global/custom';
import { LOCAL_STORAGE_KEYS, QUESTIONNAIRE_VERSION } from '../../global/constants';
import { XML_ORDER, QUESTION } from '../../global/questions';
import i18next from '../../global/utils/i18n';
import { trackEvent, TRACKING_EVENTS } from '../../global/utils/track';
import { Answers } from '../views/questionnaire/questionnaire';
import { createFHIRQuestionnaireResponse } from '../../global/fhir/response';

import { generateValuePairs, KeyValue } from './utils';

@Component({
  styleUrl: 'qr-code.css',
  tag: 'ia-qr-code',
})
export class QRCode {
  @Prop() answers: any = {};
  @Prop() resultCase: number = 5;
  @State() language: string;
  @Prop() fhirResponse: string;

  @Listen('changedLanguage', {
    target: 'window',
  })
  changedLanguageHandler(event: CustomEvent) {
    this.language = event.detail.code;
  }

  generateXML = (answers): string => {
    let xml = `<PATIENT><V0>${QUESTIONNAIRE_VERSION}</V0>`;
    let valuePairs = generateValuePairs(answers);
    valuePairs.sort(this.XMLSort);
    for (const pair of valuePairs) {
      xml += `<${pair.key}>${pair.value}</${pair.key}>`;
    }
    xml += '</PATIENT>';
    return xml;
  };

  XMLSort = (a: KeyValue, b: KeyValue): number => {
    let a_prefix = XML_ORDER.indexOf(a.key[0]);
    let b_prefix = XML_ORDER.indexOf(b.key[0]);
    if (a_prefix !== b_prefix) {
      return a_prefix - b_prefix;
    }

    let a_suffix = a.key[1];
    let b_suffix = b.key[1];
    if (a_suffix !== b_suffix) {
      return a_suffix < b_suffix ? -1 : 1;
    }

    return 0;
  };

  generateCode = (): string => {
    const svgString = qrcode({
      content: this.generateXML(this.answers),
      padding: 0,
      width: 540,
      height: 540,
      color: '#000000',
      background: '#ffffff',
      ecl: 'H',
    });

    return svg2url(svgString);
  };

  generateDonationXML = (answers: Answers) => {
    const postalCode = `<V1>${answers[QUESTION.POSTAL_CODE]}</V1>`;
    const resultCase = `<V2>${this.resultCase}</V2>`;
    return `<PATIENT>${postalCode}${resultCase}</PATIENT>`;
  };

  createFHIR = () => {
    console.log("test test");
    const valuePairs = generateValuePairs(this.answers);
    console.log(valuePairs);
    const fhir = createFHIRQuestionnaireResponse(valuePairs, this.language);
    return fhir;
  };

  sendXMLData = async () => {
    const response = await fetch(PANDEMIC_TRACKING_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.createFHIR()),
    })
    const responseText = await response.text();

    if (response.ok) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.DATA_SENT, 'true');
      trackEvent([...TRACKING_EVENTS.DATA_DONATION_SENT, '1']);
      return JSON.parse(responseText);
    } else {
      trackEvent([...TRACKING_EVENTS.DATA_DONATION_SENT, '0']);
      return responseText;
    }
  };

  componentWillLoad = () => {
    const dataSent = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.DATA_SENT));
    /*if (
      PANDEMIC_TRACKING_IS_ENABLED &&
      !dataSent &&
      this.answers[QUESTION.DATA_DONATION] === '0'
    ) {
    }*/
  };

  private handleClick = () => {
    this.fhirResponse = i18next.t('summery_donate_waiting');
    this.sendXMLData().then(response => {
      this.fhirResponse = i18next.t('summery_donate_answer') + ' ' + response.id;
    }).catch(error => {
      console.error(error);
      this.fhirResponse = i18next.t('summery_donate_error');
    });
  }

  render() {
    const { generateCode, answers } = this;

    return (
      <div class="qr-code">
        <h3>{i18next.t('qr_code_headline')}</h3>
        <p>{i18next.t('qr_code_paragraph')}</p>
        <ia-answers-table answers={answers} />
        <div class="qr-code__img-code u-text-align--center">
          <img
            src={generateCode()}
            alt="QR code generated based on the provided answers"
          />
        </div>
        <h3>{i18next.t('summery_donate_headline')}</h3>
        <d4l-button
              type="button"
              classes="button--block button--secondary "
              text={i18next.t('summary_donate_button')}
              onClick={this.handleClick}
            />
        <d4l-alert type="green">
          {this.fhirResponse}
        </d4l-alert>
      </div>
    );
  }
}
