import { churchtoolsClient } from '@churchtools/churchtools-client';

export interface Group {
  id: number;
  name: string;
  groupTypeId?: number;
  campusId?: number;
  note?: string;
}

export interface GroupMember {
  personId: number;
  groupId: number;
  groupTypeRoleId?: number;
  memberStartDate?: string;
  memberEndDate?: string;
  comment?: string;
}

export interface GroupSearchParams {
  query?: string;
  groupTypeIds?: number[];
  campusIds?: number[];
  limit?: number;
}

export class GroupService {
  /**
   * Gruppen in ChurchTools suchen
   */
  static async searchGroups(params: GroupSearchParams = {}): Promise<Group[]> {
    try {
      const queryParams: any = {};

      if (params.query) {
        queryParams.query = params.query;
      }

      if (params.groupTypeIds && params.groupTypeIds.length > 0) {
        queryParams.group_type_ids = params.groupTypeIds.join(',');
      }

      if (params.campusIds && params.campusIds.length > 0) {
        queryParams.campus_ids = params.campusIds.join(',');
      }

      if (params.limit) {
        queryParams.limit = params.limit;
      }

      const response: any = await churchtoolsClient.get('/groups', queryParams);
      const data = response.data || response;

      return (data.data || data).map((g: any) => ({
        id: g.id,
        name: g.name || '',
        groupTypeId: g.groupTypeId,
        campusId: g.campusId,
        note: g.note,
      }));
    } catch (error) {
      console.error('Failed to search groups:', error);
      return [];
    }
  }

  /**
   * Einzelne Gruppe anhand ID abrufen
   */
  static async getGroup(id: number): Promise<Group | null> {
    try {
      const response: any = await churchtoolsClient.get(`/groups/${id}`);
      const data = response.data || response;
      const g = data.data || data;

      return {
        id: g.id,
        name: g.name || '',
        groupTypeId: g.groupTypeId,
        campusId: g.campusId,
        note: g.note,
      };
    } catch (error) {
      console.error(`Failed to get group ${id}:`, error);
      return null;
    }
  }

  /**
   * Mitglieder einer Gruppe abrufen
   */
  static async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    try {
      const response: any = await churchtoolsClient.get(`/groups/${groupId}/members`);
      const data = response.data || response;

      return (data.data || data).map((m: any) => ({
        personId: m.personId,
        groupId: m.groupId,
        groupTypeRoleId: m.groupTypeRoleId,
        memberStartDate: m.memberStartDate,
        memberEndDate: m.memberEndDate,
        comment: m.comment,
      }));
    } catch (error) {
      console.error(`Failed to get members for group ${groupId}:`, error);
      return [];
    }
  }

  /**
   * Person zu Gruppe hinzufügen
   */
  static async addMemberToGroup(
    groupId: number,
    personId: number,
    roleId?: number
  ): Promise<void> {
    try {
      const body: any = {
        personId,
      };

      if (roleId) {
        body.groupTypeRoleId = roleId;
      }

      await churchtoolsClient.post(`/groups/${groupId}/members`, body);
    } catch (error) {
      console.error(`Failed to add person ${personId} to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Person aus Gruppe entfernen
   */
  static async removeMemberFromGroup(groupId: number, personId: number): Promise<void> {
    try {
      await churchtoolsClient.deleteApi(`/groups/${groupId}/members/${personId}`);
    } catch (error) {
      console.error(`Failed to remove person ${personId} from group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Gruppe erstellen
   */
  static async createGroup(data: {
    name: string;
    groupTypeId: number;
    campusId?: number;
    note?: string;
  }): Promise<Group> {
    try {
      const response: any = await churchtoolsClient.post('/groups', data);
      const responseData = response.data || response;
      const g = responseData.data || responseData;

      return {
        id: g.id,
        name: g.name || '',
        groupTypeId: g.groupTypeId,
        campusId: g.campusId,
        note: g.note,
      };
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  /**
   * Gruppe aktualisieren
   */
  static async updateGroup(
    id: number,
    data: {
      name?: string;
      groupTypeId?: number;
      campusId?: number;
      note?: string;
    }
  ): Promise<Group> {
    try {
      const response: any = await churchtoolsClient.put(`/groups/${id}`, data);
      const responseData = response.data || response;
      const g = responseData.data || responseData;

      return {
        id: g.id,
        name: g.name || '',
        groupTypeId: g.groupTypeId,
        campusId: g.campusId,
        note: g.note,
      };
    } catch (error) {
      console.error(`Failed to update group ${id}:`, error);
      throw error;
    }
  }
}
