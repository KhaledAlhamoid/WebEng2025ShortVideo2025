import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss']
})
export class Upload {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFile: File | null = null;
  isUploading = false;
  errorMessage: string | null = null;

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

   private handleFile(file: File): void {
    this.errorMessage = null;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Please select a valid video file (MP4 or WebM).';
      this.selectedFile = null;
      return;
    }

    // Validate file size (e.g., max 50MB)
    const maxSizeMB = 50;
    if (file.size > 50 * 1024 * 1024) {
      this.errorMessage = `File size exceeds ${maxSizeMB} MB limit.`;
      this.selectedFile = null;
      return;
    }

    // Validate video duration (max 1 minute)
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      if (duration > 60) {
        this.errorMessage = 'Video duration exceeds 1 minute limit.';
        this.selectedFile = null;
      } else {
        this.selectedFile = file;
      }
    };

    video.onerror = () => {
      this.errorMessage = 'Error reading video file.';
      this.selectedFile = null;
      URL.revokeObjectURL(video.src);
    };
  }

  startUpload(): void {
    if (!this.selectedFile || this.isUploading) return;

    this.isUploading = true;
    this.errorMessage = null;

    // Simulate upload (replace with actual service call)
    setTimeout(() => {
      console.log('Uploading file:', this.selectedFile);
      this.isUploading = false;
      console.log('File uploaded successfully:', File.name);
      this.selectedFile = null;
      this.fileInput.nativeElement.value = '';
    }, 2000);

  }
}