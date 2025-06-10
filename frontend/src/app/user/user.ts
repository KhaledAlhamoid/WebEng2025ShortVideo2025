import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';


export interface Video {
  id: number;
  title: string;
  thumbnail: string;
  // Add other video properties as needed
}

export interface User {
  username: string;
  profilePic: string;
}

export interface Settings {
  language: 'en' | 'de';
  theme: 'light' | 'dark';
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.scss']
})
export class User implements OnInit, OnDestroy {
  user: User | null = null;
  userVideos: Video[] = [];
  settings: Settings = { language: 'en', theme: 'light' };
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();
  userService: any;

  constructor(
      private router: Router
  ) {}

  ngOnInit(): void {
    // Load user data
    this.userService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: User | null) => {
        this.user = user;
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to load user data.';
        console.error(err);
      }
    });

    // Load user videos
    this.userService.getUserVideos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (videos: Video[]) => {
        this.userVideos = videos;
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to load videos.';
        console.error(err);
      }
    });

    // Load user settings
    this.userService.getSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings: Settings) => {
        this.settings = settings;
        this.applyTheme(settings.theme);
      },
      error: (err: any) => {
        console.error('Failed to load settings:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToVideo(videoId: number): void {
    this.router.navigate(['/feed', videoId]);
  }

  updateLanguage(language: 'en' | 'de'): void {
    this.settings.language = language;
    this.userService.saveSettings(this.settings).subscribe({
      error: (err: any) => {
        this.errorMessage = 'Failed to save language settings.';
        console.error(err);
      }
    });
  }

  updateTheme(theme: 'light' | 'dark'): void {
    this.settings.theme = theme;
    this.applyTheme(theme);
    this.userService.saveSettings(this.settings).subscribe({
      error: (err: any) => {
        this.errorMessage = 'Failed to save theme settings.';
        console.error(err);
      }
    });
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
  }
}