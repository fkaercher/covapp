import { CATEGORIES_VALUESET } from '../fhir/valuesets';
import { KeyValue } from '../../components/qr-code/utils';
import { QUESTIONNAIRE_VERSION } from '../constants';
import { LANGUAGE_RESOURCES } from '../custom';
import { QUESTION } from '../questions';
import {
  FHIRQuestionnaireItem,
  FHIRQuestionnaireResponse,
  FHIRResponseItem,
  FHIRAnswerValueCoding,
  FHIRAnswerValueDate,
} from './types';
import {
  AGE_VALUESET,
  DATE_ANSWERS,
  FEVER_VALUESET,
  WORKSPACE_VALUESET,
  YES_NO_VALUESET,
  HOUSING_VALUESET,
  PREGNANCY_VALUESET,
} from './valuesets';

export const createFHIRQuestionnaireResponse = (
  answers: KeyValue[],
  language: string
): FHIRQuestionnaireResponse => {
  const version = QUESTIONNAIRE_VERSION.split('').join('.');
  let response: FHIRQuestionnaireResponse = {
    resourceType: 'QuestionnaireResponse',
    language: "de",
    questionnaire: `http://fhir.data4life.care/covid-19/r4/Questionnaire/covid19-recommendation|${version}`,
    authored: new Date().toISOString(),
    status: 'completed',
    item: createItemsPerCategory(answers, language),
  };

  return response;
};

const createItemsPerCategory = (
  answers: KeyValue[],
  language: string
): FHIRResponseItem[] => {
  let items = [];

  const answersByCategory = groupByCategory(answers);

  for (const category of answersByCategory) {
    items.push(createItemCategory(category, language));
  }

  return items;
};

export const groupByCategory = (answers: KeyValue[]): KeyValue[][] => {
  let categories: KeyValue[][] = [];
  let category: KeyValue[] = [];
  if (answers.length > 0) {
    let previousCategory = answers[0].key[0];
    for (const answer of answers) {
      if (answer.key[0] === previousCategory) {
        category.push(answer);
      } else {
        categories.push(category);
        category = [];
        category.push(answer);
        previousCategory = answer.key[0];
      }
    }
    categories.push(category);
  }

  return categories;
};

export const createItemCategory = (
  answers: KeyValue[],
  language: string
): FHIRQuestionnaireItem => {
  const id = answers[0].key[0];

  let items = [];
  for (const answer of answers) {
    items.push(createItem(answer, language));
  }

  let item: FHIRQuestionnaireItem = {
    linkId: answers[0].key[0],
    text: CATEGORIES_VALUESET[id],
    item: items,
  };

  return item;
};

export const createItem = (
  answer: KeyValue,
  language: string
): FHIRResponseItem => {
  let answerItem: FHIRAnswerValueCoding | FHIRAnswerValueDate;
  console.log("key :"+answer.key);
  if (DATE_ANSWERS.indexOf(answer.key) > -1) {
    console.log("valueDate: "+answer.value);
    let year = answer.value.substr(0,4);
    let month = answer.value.substr(4,2);
    let day = answer.value.substr(6,2);
    answerItem = {
      valueDate: year+"-"+month+"-"+day,
    };
  } else {
    answerItem = {
      valueCoding: {
        system: getCodingSystem(answer),
        code: getCode(answer),
      },
    };
  }
  console.log("result: "+answerItem);
  let item: FHIRResponseItem = {
    linkId: answer.key,
    text: LANGUAGE_RESOURCES["de"].translation[`q_${answer.key}_text`],
    answer: [answerItem],
  };

  return item;
};

const getCodingSystem = (answer: KeyValue) => {
  switch (answer.key) {
    case QUESTION.AGE:
      return 'http://fhir.data4life.care/covid-19/r4/CodeSystem/age-group';
    case QUESTION.WORKSPACE:
      if (answer.value === '2') {
        return "http://loinc.org"
      }
      return 'http://fhir.data4life.care/covid-19/r4/CodeSystem/occupation-class';
    case 'S2':
      if (answer.value === '7') {
        return 'http://loinc.org';
      }
      return 'http://fhir.data4life.care/covid-19/r4/CodeSystem/fever-class';
    default:
      return 'http://loinc.org';
  }
};

const getCode = (answer: KeyValue): string => {
  console.log(answer.key + " " + answer.value);
  switch (answer.key) {
    case QUESTION.AGE:
      return AGE_VALUESET[answer.value];
    case QUESTION.HOUSING:
      return HOUSING_VALUESET[answer.value];
    case QUESTION.WORKSPACE:
      return WORKSPACE_VALUESET[answer.value];
    case 'P6':
      return PREGNANCY_VALUESET[answer.value];
    case 'S2':
      return FEVER_VALUESET[answer.value];
    default:
      return YES_NO_VALUESET[answer.value];
  }
};
