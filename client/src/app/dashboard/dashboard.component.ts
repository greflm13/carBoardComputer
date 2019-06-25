import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public musicStatus: MusicInfo = { title: '', artist: '', album: '', playing: false };

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

}

interface MusicInfo {
  title: string;
  artist: string;
  album: string;
  playing: boolean;
}