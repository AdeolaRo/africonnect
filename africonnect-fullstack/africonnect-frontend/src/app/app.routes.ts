import { Routes } from '@angular/router';
import { ForumComponent } from './features/forum/forum.component';
import { MarketplaceComponent } from './features/marketplace/marketplace.component';
import { EmploiComponent } from './features/jobs/jobs.component';
import { SolutionsComponent } from './features/solutions/solutions.component';
import { SolidariteComponent } from './features/solidarity/solidarity.component';
import { EvenementsComponent } from './features/events/events.component';
import { GroupesComponent } from './features/groups/groups.component';
import { MessagingComponent } from './features/messaging/messaging.component';
import { AdminComponent } from './features/admin/admin.component';
import { ProfileComponent } from './features/profile/profile.component';
import { UserManagementComponent } from './features/admin/user-management.component';
import { AdRequestComponent } from './features/ads/ad-request.component';
import { PaymentComponent } from './features/payment/payment.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { StaffGuard } from './core/guards/staff.guard';
import { SearchComponent } from './features/search/search.component';

export const routes: Routes = [
  { path: 'reset-password/:token', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'forum', component: ForumComponent },
  { path: 'marketplace', component: MarketplaceComponent },
  { path: 'emploi', component: EmploiComponent },
  { path: 'solutions', component: SolutionsComponent },
  { path: 'solidarite', component: SolidariteComponent },
  { path: 'evenements', component: EvenementsComponent },
  { path: 'groupes', component: GroupesComponent },
  { path: 'groupes/:id', loadComponent: () => import('./features/groups/group-detail.component').then(m => m.GroupDetailComponent) },
  { path: 'plan-du-site', loadComponent: () => import('./features/legal/sitemap.component').then(m => m.SitemapComponent) },
  { path: 'legal', loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent) },
  { path: 'messagerie', component: MessagingComponent, canActivate: [AuthGuard] },
  { path: 'publicite/demande', component: AdRequestComponent, canActivate: [AuthGuard] },
  { path: 'paiement', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'compte/donnees', loadComponent: () => import('./features/privacy/privacy-data.component').then(m => m.PrivacyDataComponent), canActivate: [AuthGuard] },
  { path: 'admin/access-logs', loadComponent: () => import('./features/admin/admin-access-logs.component').then(m => m.AdminAccessLogsComponent), canActivate: [AdminGuard] },
  { path: 'recherche', component: SearchComponent },
  { path: 'moderation', loadComponent: () => import('./features/admin/content-moderation.component').then(m => m.ContentModerationComponent), canActivate: [StaffGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: 'admin/users', component: UserManagementComponent, canActivate: [AdminGuard] },
  { path: 'admin/ads', loadComponent: () => import('./features/admin/ad-management.component').then(m => m.AdManagementComponent), canActivate: [AdminGuard] },
  { path: 'admin/ad-requests', loadComponent: () => import('./features/admin/ad-requests-management.component').then(m => m.AdRequestsManagementComponent), canActivate: [AdminGuard] },
  { path: 'admin/moderation', loadComponent: () => import('./features/admin/content-moderation.component').then(m => m.ContentModerationComponent), canActivate: [AdminGuard] },
  { path: 'admin/rss', loadComponent: () => import('./features/admin/rss-management.component').then(m => m.RssManagementComponent), canActivate: [AdminGuard] },
  { path: 'admin/legal', loadComponent: () => import('./features/admin/legal-management.component').then(m => m.LegalManagementComponent), canActivate: [AdminGuard] },
  { path: '', redirectTo: 'forum', pathMatch: 'full' }
];