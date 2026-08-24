export const cardStatuses = ['active', 'inactive', 'expired'] as const;

export type CardStatus = (typeof cardStatuses)[number];

export type CardRecord = {
  id: string;
  fullName: string;
  employeeId: string;
  department: string;
  roleTitle: string;
  email: string;
  phone: string;
  bloodGroup: string | null;
  issueDate: string;
  expiryDate: string;
  status: CardStatus;
  accentColor: string;
  photoKey: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type NewCardRecord = CardRecord;
