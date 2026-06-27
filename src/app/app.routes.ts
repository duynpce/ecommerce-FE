import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'register',
		loadComponent: () =>
			import('../feat/auth/register/register.component').then(
				(m) => m.RegisterComponent
			),
	},
	{
		path: 'callback/:authServer',
		loadComponent: () =>
			import('../feat/auth/callback/callback.component').then(
				(m) => m.CallbackComponent
			),
	},
	{
		path: 'logout',
		loadComponent: () =>
			import('../feat/auth/logout/logout.component').then((m) => m.LogoutComponent),
	},
	{
		path: '',
		loadComponent: () =>
			import('../feat/home/home.component').then((m) => m.HomeComponent),
	},
	{
		path: '**',	
		redirectTo: '',
	},
];
