import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public musicStatus: Properties = {
    Browsable: false, Device: '', Name: '', Playlist: '', Type: '', Subtype: '', Position: 0, Status: '', Searchable: false,
    Track: { Album: '', Artist: '', Title: '', Duration: 0, Item: '', TrackNumber: 0, NumberOfTracks: 0 }
  };
  public playing = false;

  constructor(private http: HttpService) { }

  ngOnInit() {
    setInterval(() => {
      this.http.get('api/info').then((res: Properties) => {
        this.musicStatus = res;
        this.playing = res.Status === 'playing' ? true : false;
      });
    }, 1000);
    this.http.get('api/info').then((res) => {
      this.musicStatus = res;
      this.playing = res.Status === 'playing' ? true : false;
    });
  }

  prev() {
    this.http.post('api/prev', null).then((res) => {
      this.musicStatus = res;
      this.playing = res.Status === 'playing' ? true : false;
    });;
  }
  play() {
    this.http.post('api/play', null).then((res) => {
      this.musicStatus = res;
      this.playing = res.Status === 'playing' ? true : false;
    });;
  }
  pause() {
    this.http.post('api/pause', null).then((res) => {
      this.musicStatus = res;
      this.playing = res.Status === 'playing' ? true : false;
    });;
  }
  pnext() {
    this.http.post('api/next', null).then((res) => {
      this.musicStatus = res;
      this.playing = res.Status === 'playing' ? true : false;
    });;
  }
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