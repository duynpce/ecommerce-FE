import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  readonly ui = UI_CLASS_NAME;
  readonly remoteLoginUrl = environment.REMOTE_LOGIN_API_URL;
  readonly localLoginUrl = environment.LOCAL_LOGIN_API_URL;
}
