import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.email, this.password).subscribe(user => {
      if (user) {
        // Navigate based on role
        if (user.role === 'admin') {
          this.router.navigate(['/app-admin-homepage']);
        } else {
          this.router.navigate(['/app-user-homepage']);
        }
      } else {
        this.errorMessage = 'Invalid credentials!';
      }
    });
  }
}
