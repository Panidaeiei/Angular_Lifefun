import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-post',
  imports: [MatToolbarModule, RouterModule, CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatChipsModule, MatMenuModule, MatButtonModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  userId: string = '';
  searchText: string = '';
  selectedImages: { file: File; url: string }[] = [];
  fullscreenImage: { url: string } | null = null;
  selectedVideo: { file: File; url: string } | null = null;
  fullscreenVideo: { url: string } | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });
  }

  onSearchChange() {
    // Implement search logic here
    console.log('Searching for:', this.searchText);
  }

  clearSearch() {
    this.searchText = '';
  }

  openImage(image: { url: string }) {
    this.fullscreenImage = image;
  }

  closeImage() {
    this.fullscreenImage = null;
  }

  openVideo(video: { url: string }) {
    this.fullscreenVideo = video;
  }

  closeVideo() {
    this.fullscreenVideo = null;
  }

  triggerFileInput(type: 'images' | 'video'): void {
    const inputId = type === 'images' ? 'file-images' : 'file-video';
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    fileInput.click();
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);

      if (files.length + this.selectedImages.length > 5) {
        alert('คุณสามารถเลือกรูปภาพได้สูงสุด 5 ไฟล์');
      } else {
        const validImages = files.filter(file => file.type.startsWith('image/'));
        validImages.forEach(file => {
          const reader = new FileReader();
          reader.onload = () => {
            this.selectedImages.push({ file, url: reader.result as string });
          };
          reader.readAsDataURL(file);
        });
      }

      input.value = ''; 
    }
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const file = input.files[0];
      if (file.type.startsWith('video/')) {
        if (this.selectedVideo) {
          alert('คุณสามารถเลือกวิดีโอได้เพียง 1 ไฟล์');
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            this.selectedVideo = { file, url: reader.result as string };
          };
          reader.readAsDataURL(file);
        }
      } else {
        alert('โปรดเลือกไฟล์วิดีโอ');
      }

      input.value = '';
    }
  }

  removeImage(image: { file: File; url: string }): void {
    this.selectedImages = this.selectedImages.filter(img => img !== image);
  }

  removeVideo(): void {
    this.selectedVideo = null;
  }
}