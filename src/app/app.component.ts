import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterModule} from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterModule,HttpClientModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Lifefun_project';
}
