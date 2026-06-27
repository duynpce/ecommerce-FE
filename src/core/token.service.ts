import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _token$ = new BehaviorSubject<string | null>(null);

  readonly token$: Observable<string | null> = this._token$.asObservable();

  get(): string | null {
    return this._token$.getValue();
  }

  set(token: string | null): void {
    this._token$.next(token);
  }
}