import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SearchUser } from '../../models/search-user.model';
import { UserService } from '../../services/Userservice';

@Component({
  selector: 'app-search-main',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './search-main.component.html',
  styleUrl: './search-main.component.scss'
})
export class SearchMainComponent {

  searchResults: SearchUser[] = [];
  searchQuery: string = '';
  Profileuser: string = '';
  errorMessage: string = '';
  followedId: string = '';
  followersCount: number = 0;
  isSearchPerformed: boolean = false; // ตรวจสอบว่ามีการค้นหาแล้วหรือไม่

  constructor(private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,) { }


  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.searchResults = [];
      this.isSearchPerformed = false;
      return;
    }

    this.isSearchPerformed = true;

    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
      },
      error: (error) => {
        console.error('Error searching users:', error);
      },
    });
  }

  goToProfile(userId: string): void {
    console.log('Navigating to user profile:', userId);

    if (!userId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }

    this.router.navigate(['/viewuser_main'], { queryParams: { Profileuser: userId } });
  }

}
