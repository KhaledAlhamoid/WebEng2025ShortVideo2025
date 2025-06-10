import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';



export interface Video {
  id: number; 
  src: string;
  url:string
  title: string;
  author: string;
  score: number;
  userVote: 'up' | 'down' | 'none'; 
  comments: Comment[];
}

export  interface Comment {
  username: string;
  text: string;
  timestamp: Date;
  profilePic: string;
}

export interface Video {
  id: number;
  src: string;
  title: string;
  author: string;
  score: number;
  userVote: 'up' | 'down' | 'none';
  comments: Comment[];
}
@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, DatePipe], // DatePipe für {{ date | date:'short' }}
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss']
 
})
export class Feed implements OnInit, OnDestroy {
  videos: Video[] = []; // 
  currentVideo: Video | undefined; 
  showComments = false; 
  hasVotedUp = false;  
  hasVotedDown = false; 
  private touchStartX?: number; 
  private destroy$ = new Subject<void>(); 
  feedService: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
   
  ) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

ngOnInit(): void {
  this.feedService.getVideos().pipe(first(), takeUntil(this.destroy$)).subscribe({
    next: (videos: Video[]) => {
      this.videos = videos;
      this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const id = +(params.get('id') || '1');
        this.currentVideo = this.videos.find(v => v.id === id) || this.videos[0];
        if (this.currentVideo) {
          this.updateLocalVoteState();
        } else {
          console.warn('No video found for ID:', id);
        }
      });
    },
    error: (err: any) => {
      console.error('Failed to load videos:', err);
      this.videos = [];
      this.currentVideo = undefined;
    }
  });
}Destroy(): void {
    this.destroy$.next();    
    this.destroy$.complete(); 
  }

  // --- Host Listener für Touch-Navigation (Mobile) ---
  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
  }

 
onTouchEnd(e: TouchEvent): void {
  if (this.touchStartX === undefined || !this.currentVideo) return;

  const delta = this.touchStartX - e.changedTouches[0].clientX;
  const swipeThreshold = 50;

  if (Math.abs(delta) > swipeThreshold) {
    const currentIndex = this.videos.findIndex(v => v.id === this.currentVideo!.id);
    if (delta > 0 && currentIndex < this.videos.length - 1) {
      this.navigateToVideo(this.videos[currentIndex + 1].id); // Next video
    } else if (delta < 0 && currentIndex > 0) {
      this.navigateToVideo(this.videos[currentIndex - 1].id); // Previous video
    }
  }
  this.touchStartX = undefined;
}

  // --- Abstimmungslogik (Vote) ---
  vote(up: boolean): void {
    if (!this.currentVideo) return; // Abbruch, wenn kein Video geladen ist

    const videoId = this.currentVideo.id;
    const { votedUp, votedDown } = this.feedService.getUserVoteState(videoId);

    // Überprüfen, ob der Benutzer bereits in die gleiche Richtung abgestimmt hat
    if ((up && votedUp) || (!up && votedDown)) {
      return; // Nichts tun, wenn bereits abgestimmt wurde
    }

    let delta = 0;
    if (up) {
      delta = 1; // Upvote
      if (votedDown) { // Wenn zuvor Downvote, jetzt Upvote -> +2 Score (Remove Downvote, Add Upvote)
        delta = 2;
      }
    } else { // Downvote
      delta = -1;
      if (votedUp) { // Wenn zuvor Upvote, jetzt Downvote -> -2 Score (Remove Upvote, Add Downvote)
        delta = -2;
      }
    }

    // Aktualisiere den Score über den Service
    this.feedService.updateScore(videoId, delta);

    // Aktualisiere den Abstimmungsstatus im Service
    this.feedService.setUserVoteState(videoId, up, !up);

    // Aktualisiere die lokalen Zustände für die UI
    this.updateLocalVoteState();
    this.updateLocalScore();
  }

  private updateLocalVoteState(): void {
    if (this.currentVideo) {
      const { votedUp, votedDown } = this.feedService.getUserVoteState(this.currentVideo.id);
      this.hasVotedUp = votedUp;
      this.hasVotedDown = votedDown;
    }
  }

  private updateLocalScore(): void {
    if (this.currentVideo) {
      this.currentVideo.score = this.feedService.getVideoScore(this.currentVideo.id);
    }
  }

  // --- Kommentar-Funktionalität ---
  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  // --- Teilen-Funktionalität ---
  shareVideo(): void {
    const url = window.location.href; // Die aktuelle URL des Videos
    if (navigator.share) {
      // Web Share API wird unterstützt
      navigator.share({
        title: 'Check out this video!',
        url: url
      }).catch(console.error); // Fehler beim Teilen abfangen
    } else {
      // Fallback, wenn Web Share API nicht unterstützt wird
      // Versuchen, die URL in die Zwischenablage zu kopieren
      navigator.clipboard.writeText(url)
        .then(() => alert(`Video URL copied to clipboard: ${url}`))
        .catch(() => alert(`Web Share API not supported. Copy this URL manually: ${url}`));
    }
  }

  // --- Navigation zwischen Videos ---
  navigateToVideo(id: number): void {
    // Sicherstellen, dass das Video existiert und die ID gültig ist
    if (this.videos && this.videos.length > 0 && id >= 1 && id <= this.videos.length) {
      this.router.navigate(['/feed', id]);
    } else {
      console.warn(`Attempted to navigate to invalid video ID: ${id}`);
    }
  }
  hasPreviousVideo(): boolean {
  return !!this.currentVideo && this.videos.findIndex(v => v.id === this.currentVideo!.id) > 0;
}

hasNextVideo(): boolean {
  return !!this.currentVideo && this.videos.findIndex(v => v.id === this.currentVideo!.id) < this.videos.length - 1;
}

navigateToPreviousVideo(): void {
  if (this.currentVideo) {
    const currentIndex = this.videos.findIndex(v => v.id === this.currentVideo!.id);
    if (currentIndex > 0) {
      this.navigateToVideo(this.videos[currentIndex - 1].id);
    }
  }
}

navigateToNextVideo(): void {
  if (this.currentVideo) {
    const currentIndex = this.videos.findIndex(v => v.id === this.currentVideo!.id);
    if (currentIndex < this.videos.length - 1) {
      this.navigateToVideo(this.videos[currentIndex + 1].id);
    }
  }
}
}

