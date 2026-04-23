export interface PhysicalTest {
  id: string;
  user_id: string;
  goalkeeper_id: string;
  date: string;
  testType: string;
  value: number;
  unit: string;
  notes?: string;
  created_at: string;
}
