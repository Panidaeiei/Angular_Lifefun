import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule} from '@angular/router';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
// import { NotificationService } from './notification.service';

const searchClient = instantMeiliSearch(
  'https://ms-3f99c75ba93f-19552.sgp.meilisearch.io',
  '516fe5a6ac4a75e3f9191ac36a01839426f159da'
)

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule,HttpClientModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Lifefun_project';
  config = {
    indexName: 'search-text',
    searchClient,
  }

  // private notificationService = inject(NotificationService);

  ngOnInit() {
    // เริ่มต้น Firebase Messaging เมื่อแอปเริ่มทำงาน
    // ต้องมี userId จาก localStorage หรือ sessionStorage
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      // this.notificationService.init(Number(userId));
    }
  }
}
