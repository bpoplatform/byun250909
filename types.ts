
export interface Company {
  id: number;
  name: string;
  registrationNumber: string;
}

export interface FiscalYear {
  id: number;
  companyId: number;
  year: string;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  isMain: boolean;
  remarks: string;
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export type SortKey = keyof Omit<FiscalYear, 'id' | 'companyId' | 'remarks' | 'isMain'>;
