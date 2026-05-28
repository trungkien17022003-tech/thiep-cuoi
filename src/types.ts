/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CeremonyType = 'vu-quy' | 'thanh-hon';

export interface WeddingEvent {
  id: string;
  name: string;
  time: string;
  date: string;
  lunar: string;
  visible: boolean;
}

export interface WeddingInvite {
  groom: string;
  bride: string;
  groomShort?: string;
  brideShort?: string;
  groomParents: string;
  brideParents: string;
  ceremonyType: CeremonyType;
  photoUrl: string;
  mapIframe: string;
  mapDirectionLink: string;
  events: WeddingEvent[];
}
