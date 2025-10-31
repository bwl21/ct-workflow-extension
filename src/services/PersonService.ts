import { churchtoolsClient } from '@churchtools/churchtools-client';

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  imageUrl?: string;
}

export interface PersonSearchParams {
  query?: string;
  groupIds?: number[];
  statusIds?: number[];
  campusIds?: number[];
  limit?: number;
}

export class PersonService {
  /**
   * Personen in ChurchTools suchen
   */
  static async searchPersons(params: PersonSearchParams = {}): Promise<Person[]> {
    try {
      const queryParams: any = {};

      if (params.query) {
        queryParams.query = params.query;
      }

      if (params.groupIds && params.groupIds.length > 0) {
        queryParams.group_ids = params.groupIds.join(',');
      }

      if (params.statusIds && params.statusIds.length > 0) {
        queryParams.status_ids = params.statusIds.join(',');
      }

      if (params.campusIds && params.campusIds.length > 0) {
        queryParams.campus_ids = params.campusIds.join(',');
      }

      if (params.limit) {
        queryParams.limit = params.limit;
      }

      const response: any = await churchtoolsClient.get('/persons', queryParams );
      const data = response.data || response;

      return (data.data || data).map((p: any) => ({
        id: p.id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        nickname: p.nickname,
        email: p.email,
        imageUrl: p.imageUrl,
      }));
    } catch (error) {
      console.error('Failed to search persons:', error);
      return [];
    }
  }

  /**
   * Einzelne Person anhand ID abrufen
   */
  static async getPerson(id: number): Promise<Person | null> {
    try {
      const response: any = await churchtoolsClient.get(`/api/persons/${id}`);
      const data = response.data || response;
      const p = data.data || data;

      return {
        id: p.id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        nickname: p.nickname,
        email: p.email,
        imageUrl: p.imageUrl,
      };
    } catch (error) {
      console.error(`Failed to get person ${id}:`, error);
      return null;
    }
  }

  /**
   * Person-Namen für Anzeige formatieren
   */
  static formatPersonName(person: Person): string {
    if (person.nickname) {
      return `${person.firstName} "${person.nickname}" ${person.lastName}`;
    }
    return `${person.firstName} ${person.lastName}`;
  }
}
