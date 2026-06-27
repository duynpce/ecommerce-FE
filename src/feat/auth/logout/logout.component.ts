import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  getStoredAuthServer,
  isAuthServer,
  setStoredAuthServer,
  type AuthServer,
} from '../auth.type';
import { LogoutButtonComponent } from './logoutButton.component';

@Component({
  selector: 'app-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LogoutButtonComponent],
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  readonly ui = UI_CLASS_NAME;

  readonly authServer = signal<AuthServer | null>(null);
  readonly authServerError = signal('');

  constructor(route: ActivatedRoute) {
    const serverFromRoute = route.snapshot.paramMap.get('authServer');

    if (isAuthServer(serverFromRoute)) {
      setStoredAuthServer(serverFromRoute);
      this.authServer.set(serverFromRoute);
      return;
    }

    const fromStorage = getStoredAuthServer();
    if (fromStorage) {
      this.authServer.set(fromStorage);
      return;
    }

    this.authServerError.set('Auth server is not selected. Use /logout/local or /logout/remote.');
  }
}
