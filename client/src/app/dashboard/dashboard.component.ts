import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public musicStatus: Properties

  constructor(private http: HttpService) { }

  ngOnInit() {
    setInterval(() => {
      this.http.get('api/info').then((res) => {
        this.musicStatus = res;
      });
    }, 500);
    this.http.get('api/info').then((res) => {
      this.musicStatus = res;
    });
  }

  prev() { this.http.post('api/prev', null); }
  play() { this.http.post('api/play', null); }
  pause() { this.http.post('api/pause', null); }
  pnext() { this.http.post('api/next', null); }
}

interface Track {
  Title: string;
  Duration: number;
  Item: string;
  Album: string;
  Artist: string;
  NumberOfTracks: number;
  TrackNumber: number;
}

interface Properties {
  Name: string;
  Type: string;
  Subtype: string;
  Position: number;
  Status: string;
  Track: Track;
  Device: string;
  Browsable: boolean;
  Searchable: boolean;
  Playlist: string;
}