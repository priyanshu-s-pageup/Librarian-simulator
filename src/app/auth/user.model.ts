export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  contact: string;
  image: string;
  role: 'admin' | 'user';
}
