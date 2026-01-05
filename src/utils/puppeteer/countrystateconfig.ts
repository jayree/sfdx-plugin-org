/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export const configSelectors = {
  updatecheck: '#bodyCell > table > tbody > tr:nth-child(1) > td > span',
  update: {
    editName: '#configurecountry:form:blockEditCountry:j_id9:j_id37:editName',
    editIsoCode: '#configurecountry:form:blockEditCountry:j_id9:j_id40:editIsoCode',
    editIntVal: '#configurecountry:form:blockEditCountry:j_id9:j_id43:editIntVal',
    editActive: '#configurecountry:form:blockEditCountry:j_id9:j_id46:editActive',
    editVisible: '#configurecountry:form:blockEditCountry:j_id9:j_id49:editVisible',
    save: '#configurecountry:form:blockEditCountry:j_id8:saveButtonTop',
  },
  create: {
    editName: '#configurenew:j_id1:blockNew:j_id9:nameSectionItem:editName',
    editIsoCode: '#configurenew:j_id1:blockNew:j_id9:codeSectionItem:editIsoCode',
    editIntVal: '#configurenew:j_id1:blockNew:j_id9:intValSectionItem:editIntVal',
    editActive: '#configurenew:j_id1:blockNew:j_id9:activeSectionItem:editActive',
    editVisible: '#configurenew:j_id1:blockNew:j_id9:visibleSectionItem:editVisible',
    save: '#configurenew:j_id1:blockNew:j_id43:addButton',
  },
  setCountry: {
    editIntVal: '#configurecountry:form:blockEditCountry:j_id33:j_id40:editIntVal',
    save: '#configurecountry:form:blockTopButtons:j_id6:saveButtonTop',
  },
  fix: {},
};

export const deactivateStates: { [key: string]: { [key: string]: string[] } } = {
  CN: {
    'autonomous region': ['CN-45', 'CN-15', 'CN-64', 'CN-65', 'CN-54'],
    municipality: ['CN-11', 'CN-50', 'CN-31', 'CN-12'],
    province: [
      'CN-34',
      'CN-35',
      'CN-62',
      'CN-44',
      'CN-52',
      'CN-46',
      'CN-13',
      'CN-23',
      'CN-41',
      'CN-42',
      'CN-43',
      'CN-32',
      'CN-36',
      'CN-22',
      'CN-21',
      'CN-63',
      'CN-61',
      'CN-37',
      'CN-14',
      'CN-51',
      'CN-71',
      'CN-53',
      'CN-33',
    ],
    'special administrative region': ['CN-92', 'CN-91'],
  },
  IT: { province: ['IT-AO', 'IT-CI', 'IT-GO', 'IT-OG', 'IT-OT', 'IT-PN', 'IT-TS', 'IT-UD', 'IT-VS'] },
  MX: {
    'federal district': ['MX-DF'],
    state: [
      'MX-AG',
      'MX-BC',
      'MX-BS',
      'MX-CM',
      'MX-CH',
      'MX-CS',
      'MX-CO',
      'MX-CL',
      'MX-DG',
      'MX-GR',
      'MX-GT',
      'MX-HG',
      'MX-JA',
      'MX-ME',
      'MX-MI',
      'MX-MO',
      'MX-NA',
      'MX-NL',
      'MX-OA',
      'MX-PB',
      'MX-QE',
      'MX-QR',
      'MX-SI',
      'MX-SL',
      'MX-SO',
      'MX-TB',
      'MX-TM',
      'MX-TL',
      'MX-VE',
      'MX-YU',
      'MX-ZA',
    ],
  },
};
