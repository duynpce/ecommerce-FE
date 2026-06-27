import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  isAuthServer,
  setStoredAuthServer,
  type AuthServer,
} from '../auth.type';
import { CallbackService } from './callback.service';
import type { CallbackStatus } from './callback.type';

@Component({
  selector: 'app-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './callback.component.html',
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly callbackService = inject(CallbackService);

  readonly ui = UI_CLASS_NAME;

  readonly status = signal<CallbackStatus>('loading');
  readonly errorMessage = signal<string>('');
  readonly authServer = signal<AuthServer | null>(null);
  readonly authServerLabel = computed(() => this.authServer() ?? 'unknown');

  ngOnInit(): void {
    const authServerParam = this.route.snapshot.paramMap.get('authServer');
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!isAuthServer(authServerParam)) {
      this.status.set('error');
      this.errorMessage.set('Invalid auth server in URL. Use /callback/local or /callback/remote.');
      return;
    }

    if (!code) {
      this.status.set('error');
      this.errorMessage.set('Missing OAuth code in query string.');
      return;
    }

    this.authServer.set(authServerParam);
    setStoredAuthServer(authServerParam);

    this.callbackService
      .callback(authServerParam, { code })
      .pipe(finalize(() => this.status() === 'loading' && this.status.set('success')))
      .subscribe({
        next: () => {
          this.router.navigate(['/register', authServerParam]);
        },
        error: () => {
          this.status.set('error');
          this.errorMessage.set('Callback failed. Please try signing in again.');
        },
      });
  }
}
