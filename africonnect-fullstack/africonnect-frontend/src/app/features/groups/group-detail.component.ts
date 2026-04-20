import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="item-card" *ngIf="group">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <h2 style="margin:0;">{{ group.name }}</h2>
          <div class="text-muted" style="margin-top:6px;">
            {{ group.visibility === 'private' ? '🔒 Privé' : '🌍 Public' }}
            • 👥 {{ group.members?.length || 0 }} membre(s)
            • Par {{ group.authorName || '—' }}
          </div>
        </div>
        <button class="btn btn-secondary" (click)="goBack()">← Retour</button>
      </div>

      <div *ngIf="group.description" style="margin-top:12px;" class="text-muted">{{ group.description }}</div>
      <div *ngIf="group.rules" style="margin-top:12px; padding:12px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2);">
        <strong>Règles</strong>
        <div style="white-space:pre-wrap; margin-top:6px;">{{ group.rules }}</div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; align-items:center;">
        <button *ngIf="isLoggedIn && !isMember && !joinRequested" class="btn btn-primary" (click)="joinOrRequest()">
          {{ group.visibility === 'private' ? 'Demander à rejoindre' : 'Rejoindre' }}
        </button>
        <button *ngIf="isLoggedIn && joinRequested" class="btn btn-secondary" disabled>Demande envoyée</button>
        <button *ngIf="isLoggedIn && isMember && !isCreator" class="btn btn-secondary" (click)="leave()">Quitter</button>
        <button *ngIf="isLoggedIn && canManage" class="btn btn-secondary" (click)="settingsVisible = true">⚙️ Paramètres</button>
        <button *ngIf="isLoggedIn && canManage" class="btn btn-secondary" (click)="membersVisible = true">👥 Membres</button>
        <button *ngIf="isLoggedIn && canManage && group.visibility === 'private'" class="btn btn-secondary" (click)="requestsVisible = true">
          ✅ Demandes ({{ group.joinRequests?.length || 0 }})
        </button>
        <button *ngIf="isLoggedIn && canManage" class="btn btn-secondary" (click)="invitesVisible = true">✉️ Inviter</button>
      </div>
    </div>

    <div class="item-card" style="margin-top:16px;" *ngIf="group">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h3 style="margin:0;">Posts du groupe</h3>
        <button *ngIf="isLoggedIn && isMember" class="btn btn-primary" (click)="openPostModalForCreate()">+ Publier</button>
      </div>

      <div *ngIf="posts.length === 0" class="text-muted" style="padding:16px;">Aucun post pour le moment.</div>

      <div *ngFor="let p of posts" style="margin-top:14px; padding:14px; border:1px solid var(--border); border-radius:16px; background:var(--surface);">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="font-weight:700;">{{ p.authorName || '—' }}</div>
          <div class="text-muted" style="font-size:0.9rem;">{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
        <div style="margin-top:8px; white-space:pre-wrap;">{{ p.content }}</div>

        <div *ngIf="(p.imageUrls || []).length" class="thumb-grid" style="margin-top:10px;">
          <img *ngFor="let url of p.imageUrls" class="thumb" [src]="url" (click)="openPreview(url)" alt="image">
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; align-items:center;">
          <button class="btn" (click)="likePost(p)">❤️ {{ p.likes?.length || 0 }}</button>
          <button class="btn btn-secondary" (click)="toggleComments(p)">💬 {{ p.comments?.length || 0 }}</button>
          <button *ngIf="canDeletePost(p)" class="btn btn-secondary btn-sm" (click)="editPost(p)">Modifier</button>
          <button *ngIf="canDeletePost(p)" class="btn btn-danger btn-sm" (click)="deletePost(p)">Supprimer</button>
        </div>

        <div *ngIf="p.__showComments" style="margin-top:12px;">
          <div *ngFor="let c of (p.comments || [])" style="padding:10px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2); margin-top:8px;">
            <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-weight:700;">{{ c.authorName || '—' }}</div>
              <div class="text-muted" style="font-size:0.85rem;">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div style="margin-top:6px; white-space:pre-wrap;">{{ c.content }}</div>
          </div>

          <div *ngIf="isLoggedIn && isMember" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            <textarea class="form-control" rows="2" [(ngModel)]="commentDraft[p._id]" placeholder="Écrire un commentaire..." style="flex:1; min-width: 220px;"></textarea>
            <button class="btn btn-primary" (click)="addComment(p)" [disabled]="!(commentDraft[p._id]||'').trim()">Envoyer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings modal -->
    <app-modal [(visible)]="settingsVisible" title="Paramètres du groupe">
      <div *ngIf="group" class="auth-form">
        <label class="form-label">Nom</label>
        <input class="form-control" [(ngModel)]="edit.name">
        <label class="form-label">Description</label>
        <textarea class="form-control" rows="3" [(ngModel)]="edit.description"></textarea>
        <label class="form-label">Visibilité</label>
        <select class="form-control" [(ngModel)]="edit.visibility">
          <option value="public">Public</option>
          <option value="private">Privé</option>
        </select>
        <label class="form-label">Règles</label>
        <textarea class="form-control" rows="4" [(ngModel)]="edit.rules"></textarea>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
          <button class="btn btn-secondary" (click)="settingsVisible=false">Annuler</button>
          <button class="btn btn-primary" (click)="saveSettings()">Enregistrer</button>
        </div>
      </div>
    </app-modal>

    <!-- Members modal -->
    <app-modal [(visible)]="membersVisible" title="Membres">
      <div *ngIf="group">
        <div class="text-muted" style="margin-bottom:10px;">
          Créateur: {{ group.authorName || '—' }}
        </div>
        <div *ngFor="let uid of (group.members || [])" style="display:flex; justify-content:space-between; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); align-items:center;">
          <div style="min-width:0;">
            <div style="font-weight:700;">{{ userLabel(uid) }}</div>
            <div class="text-muted" style="font-size:0.9rem;">
              {{ isCreatorId(uid) ? 'Créateur' : (isModeratorId(uid) ? 'Modérateur' : 'Membre') }}
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
            <button *ngIf="canManage && !isCreatorId(uid) && !isModeratorId(uid)" class="btn btn-secondary btn-sm" (click)="promote(uid)">Nommer mod</button>
            <button *ngIf="canManage && !isCreatorId(uid) && isModeratorId(uid)" class="btn btn-secondary btn-sm" (click)="demote(uid)">Retirer mod</button>
            <button *ngIf="canManage && !isCreatorId(uid)" class="btn btn-danger btn-sm" (click)="ban(uid)">Bannir</button>
            <button *ngIf="canManage && !isCreatorId(uid)" class="btn btn-secondary btn-sm" (click)="remove(uid)">Retirer</button>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- Requests modal -->
    <app-modal [(visible)]="requestsVisible" title="Demandes d’adhésion">
      <div *ngIf="group">
        <div *ngIf="(group.joinRequests || []).length === 0" class="text-muted">Aucune demande.</div>
        <div *ngFor="let uid of (group.joinRequests || [])" style="display:flex; justify-content:space-between; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); align-items:center;">
          <div style="font-weight:700;">{{ userLabel(uid) }}</div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-primary btn-sm" (click)="approve(uid)">Accepter</button>
            <button class="btn btn-secondary btn-sm" (click)="deny(uid)">Refuser</button>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- Invites modal -->
    <app-modal [(visible)]="invitesVisible" title="Inviter">
      <div class="auth-form">
        <label class="form-label">Email utilisateur (déjà inscrit)</label>
        <input class="form-control" [(ngModel)]="inviteEmail" placeholder="ex: user@gmail.com">
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
          <button class="btn btn-secondary" (click)="invitesVisible=false">Fermer</button>
          <button class="btn btn-primary" (click)="sendInvite()" [disabled]="!(inviteEmail||'').trim()">Envoyer</button>
        </div>
        <div class="text-muted" style="margin-top:10px;">
          L’utilisateur recevra une notification et pourra accepter depuis la cloche.
        </div>
      </div>
    </app-modal>

    <!-- Post modal -->
    <app-modal [(visible)]="postVisible" [title]="editingPost ? 'Modifier le post' : 'Publier dans le groupe'">
      <div class="auth-form">
        <textarea class="form-control" rows="5" [(ngModel)]="newPostContent" placeholder="Écrire quelque chose..."></textarea>
        <input #postImgInput type="file" accept="image/*" (change)="addPostFile($event)" style="display:none;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:10px;">
          <button type="button" class="btn btn-secondary" (click)="postImgInput.click()" [disabled]="postFiles.length >= 3">
            + Ajouter une photo
          </button>
          <div class="text-muted" style="font-size:0.9rem;">{{ postFiles.length }}/3</div>
        </div>

        <div *ngIf="postFileUrls.length > 0" class="thumb-grid" style="margin-top:10px;">
          <div *ngFor="let url of postFileUrls; let i = index" style="position:relative;">
            <img class="thumb" [src]="url" (click)="openPreview(url)" alt="image">
            <button type="button" class="btn btn-danger btn-sm"
              (click)="removePostFile(i)"
              style="position:absolute; top:6px; right:6px; padding:6px 8px; border-radius:999px;">
              ✕
            </button>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
          <button class="btn btn-secondary" (click)="postVisible=false">Annuler</button>
          <button class="btn btn-primary" (click)="submitPost()" [disabled]="!canCreatePost()">
            {{ editingPost ? 'Enregistrer' : 'Publier' }}
          </button>
        </div>
      </div>
    </app-modal>

    <app-modal [(visible)]="previewVisible" title="Aperçu">
      <img *ngIf="previewUrl" [src]="previewUrl" alt="Aperçu" style="width:100%; max-height: 70vh; object-fit: contain; border-radius: 12px;">
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

  edit: any = { name: '', description: '', visibility: 'public', rules: '' };
  inviteEmail = '';

  newPostContent = '';
  postFiles: File[] = [];
  postFileUrls: string[] = [];
  editingPost: any = null;

  commentDraft: Record<string, string> = {};

  previewVisible = false;
  previewUrl = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
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
          rules: g?.rules || ''
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
    this.clearPostFiles();
    this.postVisible = true;
  }

  editPost(p: any) {
    this.editingPost = p;
    this.newPostContent = String(p?.content || '');
    this.clearPostFiles();
    this.postVisible = true;
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
      error: (err) => alert(err?.error?.error || 'Impossible')
    });
  }

  leave() {
    if (!this.group?._id) return;
    this.api.post(`groups/${this.group._id}/leave`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Impossible')
    });
  }

  saveSettings() {
    if (!this.group?._id) return;
    this.api.put(`groups/${this.group._id}`, this.edit).subscribe({
      next: (g: any) => { this.group = g; this.settingsVisible = false; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }

  submitPost() {
    if (this.editingPost?._id) return this.updatePost();
    return this.createPost();
  }

  approve(uid: string) {
    this.api.post(`groups/${this.group._id}/requests/${uid}/approve`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }
  deny(uid: string) {
    this.api.post(`groups/${this.group._id}/requests/${uid}/deny`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }
  remove(uid: string) {
    if (!confirm('Retirer ce membre ?')) return;
    this.api.post(`groups/${this.group._id}/members/${uid}/remove`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }
  ban(uid: string) {
    if (!confirm('Bannir ce membre ?')) return;
    this.api.post(`groups/${this.group._id}/members/${uid}/ban`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }
  promote(uid: string) {
    this.api.post(`groups/${this.group._id}/moderators/${uid}/promote`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }
  demote(uid: string) {
    this.api.post(`groups/${this.group._id}/moderators/${uid}/demote`, {}).subscribe({
      next: (g: any) => { this.group = g; this.recomputeFlags(); },
      error: (err) => alert(err?.error?.error || 'Erreur')
    });
  }

  sendInvite() {
    const email = (this.inviteEmail || '').trim();
    if (!email) return;
    this.api.post(`groups/${this.group._id}/invites`, { email }).subscribe({
      next: (g: any) => { this.group = g; this.inviteEmail = ''; alert('Invitation envoyée'); },
      error: (err) => alert(err?.error?.error || 'Erreur')
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
    return !!(this.newPostContent || '').trim() || this.postFiles.length > 0;
  }

  async createPost() {
    if (!this.group?._id) return;
    const payload: any = { content: (this.newPostContent || '').trim() };
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
          this.clearPostFiles();
          this.editingPost = null;
        },
        error: (err) => alert(err?.error?.error || 'Erreur')
      });
    } catch (e) {
      alert('Erreur upload');
    }
  }

  async updatePost() {
    if (!this.group?._id) return;
    if (!this.editingPost?._id) return;
    const payload: any = { content: (this.newPostContent || '').trim() };
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
          this.clearPostFiles();
          this.editingPost = null;
        },
        error: (err) => alert(err?.error?.error || 'Erreur')
      });
    } catch (e) {
      alert('Erreur upload');
    }
  }

  likePost(p: any) {
    this.api.post(`groups/posts/${p._id}/like`, {}).subscribe({
      next: (updated: any) => p.likes = updated?.likes || p.likes,
      error: () => alert('Erreur')
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
      error: () => alert('Erreur')
    });
  }

  canDeletePost(p: any) {
    return this.myRole === 'admin' || this.canManage || String(p.userId) === String(this.myId);
  }

  deletePost(p: any) {
    if (!confirm('Supprimer ce post ?')) return;
    this.api.delete(`groups/posts/${p._id}`).subscribe({
      next: () => this.posts = this.posts.filter(x => x._id !== p._id),
      error: () => alert('Erreur')
    });
  }

  openPreview(url: string) {
    this.previewUrl = url;
    this.previewVisible = true;
  }
}

