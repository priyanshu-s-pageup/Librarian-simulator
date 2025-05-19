import { Component } from '@angular/core';

@Component({
  selector: 'app-user-management',
  imports: [],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent {

}

export interface UserData {
  id: string;
  name: string;
  contact: string;
  email: string;
  password: string;
  image?: string;
  createdAt: string;
}
