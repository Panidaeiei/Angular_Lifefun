import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterModule} from '@angular/router';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'

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
export class AppComponent {
  title = 'Lifefun_project';
  config = {
    indexName: 'search-text',
    searchClient,
  }
}
