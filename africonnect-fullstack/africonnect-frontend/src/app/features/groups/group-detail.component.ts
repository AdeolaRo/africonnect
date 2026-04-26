import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LocationPreferenceService } from '../../core/services/location-preference.service';
import { formatLocationLine } from '../../core/utils/location-list.util';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PublishLocationStepComponent } from '../../shared/components/publish-location-step/publish-location-step.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslateModule, PublishLocationStepComponent],
  template: `
    <div class="item-card" *ngIf="group">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <h2 style="margin:0;">{{ group.name }}</h2>
          <div class="text-muted" style="margin-top:6px;">
            {{ group.visibility === 'private' ? ('🔒 ' + ('groupDetail.private' | translate)) : ('🌍 ' + ('groupDetail.public' | translate)) }}
            • 👥 {{ group.members?.length || 0 }} {{ 'groupDetail.membersCount' | translate }}
            • {{ 'groupDetail.by' | translate }} {{ group.authorName || ('forumUi.anonymous' | translate) }}
          </div>
        </div>
        <button class="btn btn-secondary" (click)="goBack()">{{ 'groupDetail.back' | translate }}</button>
      </div>

      <div *ngIf="group.description" style="margin-top:12px;" class="text-muted">{{ group.description }}</div>
      <div *ngIf="group.rules" style="margin-top:12px; padding:12px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2);">
        <strong>{{ 'groupDetail.rules' | translate }}</strong>
        <div style="white-space:pre-wrap; margin-top:6px;">{{ group.rules }}</div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; align-items:center;">
        <button *ngIf="isLoggedIn && !isMember && !joinRequested" class="btn btn-primary" (click)="joinOrRequest()">
          {{ group.visibility === 'private' ? ('groupDetail.requestJoin' | translate) : ('groupDetail.join' | translate) }}
        </button>
        <button *ngIf="isLoggedIn && joinRequested" class="btn btn-secondary" disabled>{{ 'groupDetail.requestSent' | translate }}</button>
        <button *ngIf="isLoggedIn && isMember && !isCreator" class="btn btn-secondary" (click)="leave()">{{ 'groupDetail.leave' | translate }}</button>
        <button *ngIf="isLoggedIn && canManage" class="btn btn-secondary" (click)="settingsVisible = true">⚙️ {{ 'groupDetail.settings' | translate }}</button>
        <button *ngIf="isLoggedIn && canManage" class="btn btn-secondary" (click)="membersVisible = true">👥 {{ 'groupDetail.members' | translate }}</button>
        <button *ngIf="isLoggedIn && canManage && group.visibility === 'private'" class="btn btn-secondary" (click)="requestsVisible = true">
          {{ 'groupDetail.requestsBadge' | translate:{ count: group.joinRequests?.length || 0 } }}
        </button>
        <button *ngIf="isLoggedIn && canManage" class="btn btn-secondary" (click)="invitesVisible = true">✉️ {{ 'groupDetail.invite' | translate }}</button>
      </div>
    </div>

    <div class="item-card" style="margin-top:16px;" *ngIf="group">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h3 style="margin:0;">{{ 'groupDetail.postsTitle' | translate }}</h3>
        <button *ngIf="isLoggedIn && isMember" class="btn btn-primary" (click)="openPostModalForCreate()">+ {{ 'groupDetail.postNew' | translate }}</button>
      </div>

      <div *ngIf="posts.length === 0" class="text-muted" style="padding:16px;">{{ 'groupDetail.noPosts' | translate }}</div>

      <div *ngFor="let p of posts" style="margin-top:14px; padding:14px; border:1px solid var(--border); border-radius:16px; background:var(--surface);">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="font-weight:700;">{{ p.authorName || ('forumUi.anonymous' | translate) }}</div>
          <div class="text-muted" style="font-size:0.9rem;">{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
        <div *ngIf="getLocLine(p)" class="pub-loc-pill" style="margin-top:4px;">📍 {{ getLocLine(p) }}</div>
        <div style="margin-top:8px; white-space:pre-wrap;">{{ p.content }}</div>

        <div *ngIf="(p.imageUrls || []).length" class="thumb-grid" style="margin-top:10px;">
          <img *ngFor="let url of p.imageUrls" class="thumb" [src]="url" (click)="openPreview(url)" [attr.alt]="'groupDetail.altPostImage' | translate">
        </div>

        <div *ngIf="(p.links?.length || 0) > 0" style="margin-top:10px; padding:10px; border:1px solid var(--border); border-radius:12px; background: var(--surface-2);">
          <div style="font-weight:700; margin-bottom:6px;">{{ 'common.linksTitle' | translate }}</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <a *ngFor="let l of p.links" [href]="l.url" target="_blank" rel="noopener noreferrer" style="color: var(--secondary); text-decoration:none;">
              🔗 {{ l.label || l.url }}
            </a>
          </div>
        </div>

        <div class="card-actions bottom" style="margin-top:10px;">
          <button type="button" class="btn btn-sm btn-like" (click)="likePost(p)">{{ 'common.likesCountLabel' | translate:{ count: (p.likes?.length || 0) } }}</button>
          <button type="button" class="btn btn-secondary btn-sm" (click)="toggleComments(p)">{{ 'groupDetail.commentsWithCount' | translate:{ count: p.comments?.length || 0 } }}</button>
          <button *ngIf="canDeletePost(p)" type="button" class="btn btn-secondary btn-sm" (click)="editPost(p)">{{ 'common.edit' | translate }}</button>
          <button *ngIf="canDeletePost(p)" type="button" class="btn btn-danger btn-sm" (click)="deletePost(p)">{{ 'common.delete' | translate }}</button>
        </div>

        <div *ngIf="p.__showComments" style="margin-top:12px;">
          <div *ngFor="let c of (p.comments || [])" style="padding:10px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2); margin-top:8px;">
            <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-weight:700;">{{ c.authorName || ('forumUi.anonymous' | translate) }}</div>
              <div class="text-muted" style="font-size:0.85rem;">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div style="margin-top:6px; white-space:pre-wrap;">{{ c.content }}</div>
          </div>

          <div *ngIf="isLoggedIn && isMember" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            <textarea class="form-control" rows="2" [(ngModel)]="commentDraft[p._id]" [placeholder]="'groupDetail.commentPlaceholder' | translate" style="flex:1; min-width: 220px;"></textarea>
            <button class="btn btn-primary" (click)="addComment(p)" [disabled]="!(commentDraft[p._id]||'').trim()">{{ 'groupDetail.sendComment' | translate }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings modal -->
    <app-modal [(visible)]="settingsVisible" [title]="'groupDetail.settingsTitle' | translate">
      <div *ngIf="group" class="auth-form">
        <label class="form-label">{{ 'groupDetail.fieldName' | translate }}</label>
        <input class="form-control" [(ngModel)]="edit.name">
        <label class="form-label">{{ 'groupDetail.fieldDescription' | translate }}</label>
        <textarea class="form-control" rows="3" [(ngModel)]="edit.description"></textarea>
        <label class="form-label">{{ 'groupDetail.fieldVisibility' | translate }}</label>
        <select class="form-control" [(ngModel)]="edit.visibility">
          <option value="public">{{ 'groupDetail.visibilityPublic' | translate }}</option>
          <option value="private">{{ 'groupDetail.visibilityPrivate' | translate }}</option>
        </select>
        <label class="form-label">{{ 'groupDetail.fieldRules' | translate }}</label>
        <textarea class="form-control" rows="4" [(ngModel)]="edit.rules"></textarea>

        <label class="form-label" style="margin-top:12px;">{{ 'common.linksTitle' | translate }}</label>
        <div *ngFor="let l of (edit.links || []); let i = index" style="display:grid; grid-template-columns: 1fr 1.2fr auto; gap:10px; align-items:end; margin-top:10px;">
          <div>
            <label class="form-label">{{ 'common.linkLabel' | translate }}</label>
            <input class="form-control" [(ngModel)]="l.label" [placeholder]="'common.linkLabel' | translate">
          </div>
          <div>
            <label class="form-label">{{ 'common.linkUrl' | translate }}</label>
            <input class="form-control" [(ngModel)]="l.url" [placeholder]="'common.linkUrl' | translate">
          </div>
          <button type="button" class="btn btn-secondary" (click)="removeEditLink(i)">{{ 'common.removeLink' | translate }}</button>
        </div>
        <div style="margin-top:10px;">
          <button type="button" class="btn btn-secondary" (click)="addEditLink()">{{ 'common.addLink' | translate }}</button>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
          <button class="btn btn-secondary" (click)="settingsVisible=false">{{ 'common.cancel' | translate }}</button>
          <button class="btn btn-primary" (click)="saveSettings()">{{ 'common.save' | translate }}</button>
        </div>
      </div>
    </app-modal>

    <!-- Members modal -->
    <app-modal [(visible)]="membersVisible" [title]="'groupDetail.membersTitle' | translate">
      <div *ngIf="group">
        <div class="text-muted" style="margin-bottom:10px;">
          {{ 'groupDetail.creatorLine' | translate:{ name: group.authorName || ('forumUi.anonymous' | translate) } }}
        </div>
        <div *ngFor="let uid of (group.members || [])" style="display:flex; justify-content:space-between; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); align-items:center;">
          <div style="min-width:0;">
            <div style="font-weight:700;">{{ userLabel(uid) }}</div>
            <div class="text-muted" style="font-size:0.9rem;">
              {{ isCreatorId(uid) ? ('groupDetail.creator' | translate) : (isModeratorId(uid) ? ('groupDetail.moderator' | translate) : ('groupDetail.member' | translate)) }}
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
            <button *ngIf="canManage && !isCreatorId(uid) && !isModeratorId(uid)" class="btn btn-secondary btn-sm" (click)="promote(uid)">{{ 'groupDetail.promoteMod' | translate }}</button>
            <button *ngIf="canManage && !isCreatorId(uid) && isModeratorId(uid)" class="btn btn-secondary btn-sm" (click)="demote(uid)">{{ 'groupDetail.demoteMod' | translate }}</button>
            <button *ngIf="canManage && !isCreatorId(uid)" class="btn btn-danger btn-sm" (click)="ban(uid)">{{ 'groupDetail.banMember' | translate }}</button>
            <button *ngIf="canManage && !isCreatorId(uid)" class="btn btn-secondary btn-sm" (click)="remove(uid)">{{ 'groupDetail.removeMemberBtn' | translate }}</button>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- Requests modal -->
    <app-modal [(visible)]="requestsVisible" [title]="'groupDetail.joinRequestsTitle' | translate">
      <div *ngIf="group">
        <div *ngIf="(group.joinRequests || []).length === 0" class="text-muted">{{ 'groupDetail.noRequests' | translate }}</div>
        <div *ngFor="let uid of (group.joinRequests || [])" style="display:flex; justify-content:space-between; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); align-items:center;">
          <div style="font-weight:700;">{{ userLabel(uid) }}</div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-primary btn-sm" (click)="approve(uid)">{{ 'groupDetail.accept' | translate }}</button>
            <button class="btn btn-secondary btn-sm" (click)="deny(uid)">{{ 'groupDetail.deny' | translate }}</button>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- Invites modal -->
    <app-modal [(visible)]="invitesVisible" [title]="'groupDetail.invite' | translate">
      <div class="auth-form">
        <label class="form-label">{{ 'groupDetail.emailUser' | translate }}</label>
        <input class="form-control" [(ngModel)]="inviteEmail" [placeholder]="'groupDetail.inviteEmailPlaceholder' | translate">
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
          <button class="btn btn-secondary" (click)="invitesVisible=false">{{ 'groupDetail.close' | translate }}</button>
          <button class="btn btn-primary" (click)="sendInvite()" [disabled]="!(inviteEmail||'').trim()">{{ 'groupDetail.send' | translate }}</button>
        </div>
        <div class="text-muted" style="margin-top:10px;">
          {{ 'groupDetail.inviteHelp' | translate }}
        </div>
      </div>
    </app-modal>

    <!-- Post modal -->
    <app-modal [(visible)]="postVisible" [title]="(editingPost ? 'sections.groupsPostEdit' : 'sections.groupsPostNew') | translate">
      <app-publish-location-step
        *ngIf="!editingPost && postLocationStep"
        (confirmed)="onPostLocConfirm($event)"
        (skipped)="onPostLocSkip()">
      </app-publish-location-step>
      <div class="auth-form" *ngIf="editingPost || !postLocationStep">
        <textarea class="form-control" rows="5" [(ngModel)]="newPostContent" [placeholder]="'groupDetail.postPlaceholder' | translate"></textarea>
        <input #postImgInput type="file" accept="image/*" (change)="addPostFile($event)" style="display:none;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:10px;">
          <button type="button" class="btn btn-secondary" (click)="postImgInput.click()" [disabled]="postFiles.length >= 3">
            {{ 'groupDetail.addPhoto' | translate }}
          </button>
          <div class="text-muted" style="font-size:0.9rem;">{{ postFiles.length }}/3</div>
        </div>

        <div *ngIf="postFileUrls.length > 0" class="thumb-grid" style="margin-top:10px;">
          <div *ngFor="let url of postFileUrls; let i = index" style="position:relative;">
            <img class="thumb" [src]="url" (click)="openPreview(url)" [attr.alt]="'groupDetail.altPostImage' | translate">
            <button type="button" class="btn btn-danger btn-sm"
              (click)="removePostFile(i)"
              style="position:absolute; top:6px; right:6px; padding:6px 8px; border-radius:999px;">
              ✕
            </button>
          </div>
        </div>

        <label class="form-label" style="margin-top:12px;">{{ 'common.linksTitle' | translate }}</label>
        <div *ngFor="let l of postLinks; let i = index" style="display:grid; grid-template-columns: 1fr 1.2fr auto; gap:10px; align-items:end; margin-top:10px;">
          <div>
            <label class="form-label">{{ 'common.linkLabel' | translate }}</label>
            <input class="form-control" [(ngModel)]="l.label" [placeholder]="'common.linkLabel' | translate">
          </div>
          <div>
            <label class="form-label">{{ 'common.linkUrl' | translate }}</label>
            <input class="form-control" [(ngModel)]="l.url" [placeholder]="'common.linkUrl' | translate">
          </div>
          <button type="button" class="btn btn-secondary" (click)="removePostLink(i)">{{ 'common.removeLink' | translate }}</button>
        </div>
        <div style="margin-top:10px;">
          <button type="button" class="btn btn-secondary" (click)="addPostLink()">{{ 'common.addLink' | translate }}</button>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
          <button class="btn btn-secondary" (click)="postVisible=false">{{ 'common.cancel' | translate }}</button>
          <button class="btn btn-primary" (click)="submitPost()" [disabled]="!canCreatePost()">
            {{ editingPost ? ('common.save' | translate) : ('common.publish' | translate) }}
          </button>
        </div>
      </div>
    </app-modal>

    <app-modal [(visible)]="previewVisible" [title]="'common.preview' | translate">
      <img *ngIf="previewUrl" [src]="previewUrl" [alt]="'common.preview' | translate" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
    </app-modal>
  `
})
export class GroupDetailComponent implements OnInit {
  group: any = null;
  posts: any[] = [];
  usersById: Record<string, any> = {};

  isLoggedIn = false;
  myId = '';
  myRole = '';

  joinRequested = false;
  isMember = false;
  isCreator = false;
  canManage = false;

  settingsVisible = false;
  membersVisible = false;
  requestsVisible = false;
  invitesVisible = false;
  postVisible = false;

  edit: any = { name: '', description: '', visibility: 'public', rules: '', links: [] };
  inviteEmail = '';

  newPostContent = '';
  postFiles: File[] = [];
  postFileUrls: string[] = [];
  editingPost: any = null;
  postLinks: any[] = [];
  postLocationStep = true;
  postPublishContinent = '';
  postPublishCity = '';

  commentDraft: Record<string, string> = {};

  previewVisible = false;
  previewUrl = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private locPref: LocationPreferenceService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => {
      this.isLoggedIn = !!u;
      this.myId = u?.id || '';
      this.myRole = u?.role || '';
      this.recomputeFlags();
    });

    this.loadUsers();
    this.route.params.subscribe(() => this.loadAll());
  }

  getLocLine(p: any): string {
    if (!p) return '';
    return formatLocationLine(p, (c) => this.translate.instant('location.continent.' + c));
  }

  onPostLocConfirm(e: { continent: string; city: string }) {
    this.postPublishContinent = e.continent;
    this.postPublishCity = e.city;
    this.postLocationStep = false;
  }
  onPostLocSkip() { this.postLocationStep = false; }

  goBack() { this.router.navigate(['/groupes']); }

  loadAll() {
    const id = String(this.route.snapshot.params['id'] || '');
    if (!id) return;
    this.api.get(`groups/${id}`, false).subscribe({
      next: (g: any) => {
        this.group = g;
        this.edit = {
          name: g?.name || '',
          description: g?.description || '',
          visibility: g?.visibility || 'public',
          rules: g?.rules || '',
          links: Array.isArray(g?.links) ? g.links.map((l: any) => ({ label: l?.label || '', url: l?.url || '' })) : []
        };
        this.recomputeFlags();
        this.loadPosts();
      },
      error: () => this.router.navigate(['/groupes'])
    });
  }

  loadUsers() {
    if (!this.auth.isLoggedIn()) return;
    this.api.get('user/users').subscribe({
      next: (users: any[]) => {
        const map: any = {};
        (Array.isArray(users) ? users : []).forEach(u => map[String(u._id)] = u);
        this.usersById = map;
      },
      error: () => {}
    });
  }

  loadPosts() {
    if (!this.group?._id) return;
    this.api.get(`groups/${this.group._id}/posts`, false).subscribe({
      next: (posts: any[]) => this.posts = Array.isArray(posts) ? posts : [],
      error: () => this.posts = []
    });
  }

  openPostModalForCreate() {
    this.editingPost = null;
    this.newPostContent = '';
    this.postLinks = [];
    this.clearPostFiles();
    const l = this.locPref.get();
    this.postPublishContinent = l.continent;
    this.postPublishCity = l.city;
    this.postLocationStep = true;
    this.postVisible = true;
  }

  editPost(p: any) {
    this.editingPost = p;
    this.newPostContent = String(p?.content || '');
    this.postLinks = Array.isArray(p?.links) ? p.links.map((l: any) => ({ label: l?.label || '', url: l?.url || '' })) : [];
    this.clearPostFiles();
    this.postLocationStep = false;
    this.postPublishContinent = String(p?.continent || '');
    this.postPublishCity = String(p?.city || '');
    this.postVisible = true;
  }

  addEditLink() {
    if (!Array.isArray(this.edit.links)) this.edit.links = [];
    this.edit.links.push({ label: '', url: '' });
  }

  removeEditLink(index: number) {
    if (!Array.isArray(this.edit.links)) return;
    this.edit.links.splice(index, 1);
  }

  addPostLink() {
    this.postLinks.push({ label: '', url: '' });
  }

  removePostLink(index: number) {
    this.postLinks.splice(index, 1);
  }

  recomputeFlags() {
    const g = this.group;
    if (!g) return;
    const members = Array.isArray(g.members) ? g.members.map(String) : [];
    this.isMember = this.myId ? members.includes(String(this.myId)) : false;
    this.isCreator = this.myId ? String(g.userId) === String(this.myId) : false;
    const mods = Array.isArray(g.moderators) ? g.moderators.map(String) : [];
    this.canManage = this.isCreator || mods.includes(String(this.myId)) || this.myRole === 'admin';
    this.joinRequested = false;
  }

  userLabel(uid: string) {
    const u = this.usersById[String(uid)];
    return u?.pseudo || u?.fullName || u?.email || uid;
  }
  isCreatorId(uid: string) { return String(this.group?.userId) === String(uid); }
  isModeratorId(uid: string) {
    const mods = Array.isArray(this.group?.moderators) ? this.group.moderators.map(String) : [];
    return mods.includes(String(uid));
  }

  joinOrRequest() {
    if (!this.group?._id) return;
    this.api.post(`groups/${this.group._id}/join`, {}).subscribe({
      next: (data: any) => {
        // Private group may return joinRequested flag
        this.group = data;
        this.joinRequested = !!data?.joinRequested;
        this.recomputeFlags();
      },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.impossible'))
    });
  }

  leave() {
    if (!this.group?._id) return;
    this.api.post(`groups/${this.group._id}/leave`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.impossible'))
    });
  }

  saveSettings() {
    if (!this.group?._id) return;
    this.api.put(`groups/${this.group._id}`, this.edit).subscribe({
      next: (g: any) => { this.group = g; this.settingsVisible = false; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }

  submitPost() {
    if (this.editingPost?._id) return this.updatePost();
    return this.createPost();
  }

  approve(uid: string) {
    this.api.post(`groups/${this.group._id}/requests/${uid}/approve`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }
  deny(uid: string) {
    this.api.post(`groups/${this.group._id}/requests/${uid}/deny`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }
  remove(uid: string) {
    if (!confirm(this.translate.instant('groupDetail.removeMemberConfirm'))) return;
    this.api.post(`groups/${this.group._id}/members/${uid}/remove`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }
  ban(uid: string) {
    if (!confirm(this.translate.instant('groupDetail.banMemberConfirm'))) return;
    this.api.post(`groups/${this.group._id}/members/${uid}/ban`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }
  promote(uid: string) {
    this.api.post(`groups/${this.group._id}/moderators/${uid}/promote`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }
  demote(uid: string) {
    this.api.post(`groups/${this.group._id}/moderators/${uid}/demote`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }

  sendInvite() {
    const email = (this.inviteEmail || '').trim();
    if (!email) return;
    this.api.post(`groups/${this.group._id}/invites`, { email }).subscribe({
      next: (g: any) => { this.group = g; this.inviteEmail = ''; alert(this.translate.instant('groupDetail.inviteSentOk')); },
      error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
    });
  }

  addPostFile(event: any) {
    const input = event?.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    if (this.postFiles.length >= 3) return;
    this.postFiles.push(file);
    this.postFileUrls.push(URL.createObjectURL(file));
    if (input) input.value = '';
  }

  removePostFile(index: number) {
    const url = this.postFileUrls[index];
    if (url) URL.revokeObjectURL(url);
    this.postFiles.splice(index, 1);
    this.postFileUrls.splice(index, 1);
  }

  clearPostFiles() {
    this.postFileUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
    this.postFiles = [];
    this.postFileUrls = [];
  }

  canCreatePost() {
    const hasText = !!(this.newPostContent || '').trim();
    const hasFiles = this.postFiles.length > 0;
    const hasLinks = (this.postLinks || []).some(l => String(l?.url || '').trim());
    return hasText || hasFiles || hasLinks;
  }

  async createPost() {
    if (!this.group?._id) return;
    const payload: any = {
      content: (this.newPostContent || '').trim(),
      continent: this.postPublishContinent || '',
      city: this.postPublishCity || ''
    };
    payload.links = (this.postLinks || [])
      .filter(l => String(l?.url || '').trim())
      .map(l => ({ label: String(l?.label || '').trim(), url: String(l?.url || '').trim() }));
    try {
      if (this.postFiles.length > 0) {
        const fd = new FormData();
        this.postFiles.forEach(f => fd.append('images', f));
        const upload: any = await this.api.post('upload', fd).toPromise();
        payload.imageUrls = Array.isArray(upload?.urls) ? upload.urls : (upload?.url ? [upload.url] : []);
      }
      this.api.post(`groups/${this.group._id}/posts`, payload).subscribe({
        next: (p: any) => {
          this.posts.unshift(p);
          this.postVisible = false;
          this.newPostContent = '';
          this.postLinks = [];
          this.clearPostFiles();
          this.editingPost = null;
        },
        error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
      });
    } catch (e) {
      alert(this.translate.instant('errors.uploadFailed'));
    }
  }

  async updatePost() {
    if (!this.group?._id) return;
    if (!this.editingPost?._id) return;
    const payload: any = {
      content: (this.newPostContent || '').trim(),
      continent: this.postPublishContinent || '',
      city: this.postPublishCity || ''
    };
    payload.links = (this.postLinks || [])
      .filter(l => String(l?.url || '').trim())
      .map(l => ({ label: String(l?.label || '').trim(), url: String(l?.url || '').trim() }));
    try {
      if (this.postFiles.length > 0) {
        const fd = new FormData();
        this.postFiles.forEach(f => fd.append('images', f));
        const upload: any = await this.api.post('upload', fd).toPromise();
        payload.imageUrls = Array.isArray(upload?.urls) ? upload.urls : (upload?.url ? [upload.url] : []);
      } else {
        payload.imageUrls = Array.isArray(this.editingPost?.imageUrls) ? this.editingPost.imageUrls : [];
      }
      this.api.put(`groups/posts/${this.editingPost._id}`, payload).subscribe({
        next: (updated: any) => {
          const idx = this.posts.findIndex(x => String(x._id) === String(updated?._id));
          if (idx >= 0) this.posts[idx] = updated;
          this.postVisible = false;
          this.newPostContent = '';
          this.postLinks = [];
          this.clearPostFiles();
          this.editingPost = null;
        },
        error: (err) => alert(err?.error?.error || this.translate.instant('errors.generic'))
      });
    } catch (e) {
      alert(this.translate.instant('errors.uploadFailed'));
    }
  }

  likePost(p: any) {
    this.api.post(`groups/posts/${p._id}/like`, {}).subscribe({
      next: (updated: any) => p.likes = updated?.likes || p.likes,
      error: () => alert(this.translate.instant('errors.generic'))
    });
  }

  toggleComments(p: any) {
    p.__showComments = !p.__showComments;
  }

  addComment(p: any) {
    const content = (this.commentDraft[p._id] || '').trim();
    if (!content) return;
    this.api.post(`groups/posts/${p._id}/comments`, { content }).subscribe({
      next: (updated: any) => {
        p.comments = updated?.comments || p.comments;
        this.commentDraft[p._id] = '';
      },
      error: () => alert(this.translate.instant('errors.generic'))
    });
  }

  canDeletePost(p: any) {
    return this.myRole === 'admin' || this.canManage || String(p.userId) === String(this.myId);
  }

  deletePost(p: any) {
    if (!confirm(this.translate.instant('groupDetail.deletePostConfirm'))) return;
    this.api.delete(`groups/posts/${p._id}`).subscribe({
      next: () => this.posts = this.posts.filter(x => x._id !== p._id),
      error: () => alert(this.translate.instant('errors.generic'))
    });
  }

  openPreview(url: string) {
    this.previewUrl = url;
    this.previewVisible = true;
  }
}

