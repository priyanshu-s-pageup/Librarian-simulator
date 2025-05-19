import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserData } from '../user-management.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, map, Subscription } from 'rxjs';
import { CommonService } from '../../../../common.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog.component';
import { environment } from '../../../../../environments/environment.development';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})

/*

  There are 5 sections:

  1. SearchBox
  2. Load Users
  3. Delete Users
  4. Input Image
  5. Handle Image

*/

export class UserListComponent implements OnInit, OnDestroy {
  public users: UserData[] = [];
  public isLoading: boolean = true;
  public searchTerm: string = '';
  private searchSubject: Subject<string> = new Subject<string>();
  private searchSubscription: Subscription | null = null;
  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 3000,
  };
  protected totalUsers: number = 0;
  protected currentPage: number = 1;
  protected pageSize: number = 10;
  protected pageNumbers: number[] = [];
  protected pageSizeOptions: number[] = [5, 10, 15, 20, 50];
  protected loading: boolean = false;
  protected sortField: string = '';
  protected sortOrder: 'ASC' | 'DESC' = 'ASC';

  sortFieldOptions = [
    { label: 'ID', value: 'id' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Created Date', value: 'createdAt' },
  ];

  protected selectedSortField: string = 'name';

  onSortChange(): void {
    this.sortField = this.selectedSortField;
    this.loadUsers();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.loadUsers();
  }


  public constructor(
    private readonly commonService: CommonService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}


  // ngOnInit:
  public ngOnInit(): void {
    this.loadUsers();
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(1000))
      .subscribe(() => {
        this.users = [];
        this.isLoading = true;
        this.loadUsers();
      });
  }


  // 1. SearchBox:
  public ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  public onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }


  // 2. Load Users:
  public loadUsers(): void {
    this.isLoading = true;

    this.commonService.getUsers(this.searchTerm, this.currentPage, this.pageSize, this.sortField, this.sortOrder)
      .subscribe({
        next: (response: HttpResponse<UserData[]>) => {
          const users = (response.body || []).map((user: UserData) => ({
            ...user,
            image: this.getSafeImageUrl(user.image),
          }));

          this.users = users;

          const totalCount = response.headers.get('X-Total-Count');
          this.totalUsers = totalCount ? +totalCount : 0;

          this.calculatePagination();
          this.isLoading = false;
        },
        error: (err: Error) => {
          console.error('Error loading users:', err);
          this.snackBar.open('Failed to load users', 'Close', this.snackBarConfig);
          this.isLoading = false;
        }
      });
  }



  // 3. Pagination Part:
  public get filteredUsers(): UserData[] {
    if (!this.searchTerm) return this.users;
    return this.users.filter(
      (user: UserData) =>
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.contact.includes(this.searchTerm)
    );
  }

  protected get totalPages(): number {
    return this.totalUsers>0 ? Math.ceil(this.totalUsers / this.pageSize) : 1;
  }

  protected onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  protected goToPage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  calculatePagination(): void {
    this.pageNumbers = [];
    const totalPages = this.totalPages;

    for (let i = 1; i <= totalPages; i++) {
      this.pageNumbers.push(i);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    const maxPage = Math.ceil(this.totalUsers / this.pageSize);
    console.log("totalBooks:", this.totalUsers, "pageSize:", this.pageSize, "maxPage:", maxPage);

    if (this.currentPage < maxPage) {
      this.currentPage++;
      console.log("next clicked. current page: ", this.currentPage);
      this.loadUsers();
    } else {
      console.log("No more pages to load");
    }
  }


  // 3. Delete User:
  public deleteUser(userId: string): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, { title: string; message: string }, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want to delete this user?',
        },
      }
    );

    // dialogbox:
    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.commonService.deleteUser(userId).subscribe({
          next: () => {
            this.snackBar.open('User deleted successfully', 'Close', this.snackBarConfig);
            this.loadUsers();
          },
          error: (err: Error) => {
            console.error('Error deleting user:', err);
            this.snackBar.open('Failed to delete user', 'Close', this.snackBarConfig);
          },
        });
      }
    });
  }


  // 4. Input Image:
  public getSafeImageUrl(imageData: string | undefined): string {

    //case - 1
    if (!imageData) {
      return this.getDefaultAvatar();
    }

    //case - 2
    if (imageData.startsWith('data:image')) {
      return imageData;
    }

    //case - 3
    if (imageData.includes('.') && !imageData.startsWith('http')) {
      return `${environment.apiUrl}/uploads/${imageData}`;
    }

    return `data:image/jpeg;base64,${imageData}`;
  }


  // 5. Handle Image Request

  // Default Image:
  public getDefaultAvatar(): string {
    return 'data:image/jpeg;base64,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';
  }

  // Handle Image Error:
  public handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;

    if (imgElement.src.includes('default-avatar')) {
      imgElement.style.display = 'none';
      return;
    }

    imgElement.src = this.getDefaultAvatar();
  }
}
