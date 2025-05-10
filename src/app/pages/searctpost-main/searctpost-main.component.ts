import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../services/Postservice';
import { ShowPost } from '../../models/showpost_model';
import { TimeAgoPipe} from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-searctpost-main',
  imports: [RouterModule, MatToolbarModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule,TimeAgoPipe],
  templateUrl: './searctpost-main.component.html',
  styleUrl: './searctpost-main.component.scss'
})
export class SearctpostMainComponent {

  constructor(private router : Router,private postService: PostService) {}

  posts: ShowPost[] = [];
  searchQuery = '';
  errorMessage = '';
  loading = false;
  
  onSearch() {
    if (this.searchQuery.trim() === '') {
      this.posts = [];
      return;
    }

    this.loading = true;
    this.postService.searchPosts(this.searchQuery).subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });

  }

}
