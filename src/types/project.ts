export interface IProject {
  user: { id: any };
  name: string;
  description: string;
  status: string;
  client_id: number;
  assigned_people: number[];
  start_date: string;
}
