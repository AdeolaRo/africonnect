const express = require('express');
const Group = require('../models/Group');
const GroupPost = require('../models/GroupPost');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

function sanitizeLinks(input) {
  const arr = Array.isArray(input) ? input : [];
  const out = [];
  for (const item of arr) {
    const url = String(item?.url || '').trim();
    if (!url) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    const label = String(item?.label || '').trim();
    out.push({ ...(label ? { label } : {}), url });
  }
  return out;
}

function isCreator(group, userId) {
  return String(group?.userId || '') === String(userId || '');
}
function isMod(group, userId) {
  const mods = Array.isArray(group?.moderators) ? group.moderators : [];
  return isCreator(group, userId) || mods.map(String).includes(String(userId || ''));
}
function isMember(group, userId) {
  const members = Array.isArray(group?.members) ? group.members : [];
  return members.map(String).includes(String(userId || ''));
}
function isBanned(group, userId) {
  const banned = Array.isArray(group?.bannedMembers) ? group.bannedMembers : [];
  return banned.map(String).includes(String(userId || ''));
}

async function notify(req, userId, payload) {
  try {
    const doc = await new Notification({
      userId: String(userId),
      type: payload?.type || 'info',
      title: payload?.title || '',
      body: payload?.body || '',
      data: payload?.data || {}
    }).save();
    const io = req.app.get('io');
    if (io) io.to(`user_${String(userId)}`).emit('notification', doc);
  } catch {
    // ignore
  }
}

router.get('/', async (req, res) => {
  const items = await Group.find().sort({ createdAt: -1 });
  res.json(items);
});

router.post('/', auth, async (req, res) => {
  const body = { ...req.body };
  if (Array.isArray(body.imageUrls)) body.imageUrls = body.imageUrls.filter(Boolean).slice(0, 3);
  else if (body.imageUrl && !body.imageUrls) body.imageUrls = [body.imageUrl].filter(Boolean).slice(0, 3);

  const item = new Group({
    ...body,
    userId: String(req.userId),
    authorName: req.userPseudo,
    members: [String(req.userId)],
    moderators: [],
    visibility: body.visibility === 'private' ? 'private' : 'public',
    rules: String(body.rules || '')
  });
  await item.save();
  res.status(201).json(item);
});

router.get('/:id', async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  res.json(item);
});

// Update group settings (creator or admin)
router.put('/:id', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isCreator(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

  const { name, description, category, visibility, rules, imageUrls, links } = req.body || {};
  if (name !== undefined) item.name = String(name || '').trim();
  if (description !== undefined) item.description = String(description || '').trim();
  if (category !== undefined) item.category = String(category || '').trim();
  if (rules !== undefined) item.rules = String(rules || '').trim();
  if (visibility !== undefined) item.visibility = visibility === 'private' ? 'private' : 'public';
  if (Array.isArray(imageUrls)) item.imageUrls = imageUrls.filter(Boolean).slice(0, 3);
  if (Array.isArray(links)) item.links = sanitizeLinks(links);
  await item.save();
  res.json(item);
});

// Join flow: public => join; private => request
router.post('/:id/join', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  const me = String(req.userId);
  if (isBanned(item, me)) return res.status(403).json({ error: 'Vous êtes banni de ce groupe' });
  if (isMember(item, me)) return res.json(item);

  if (item.visibility === 'private') {
    const reqs = Array.isArray(item.joinRequests) ? item.joinRequests : [];
    if (!reqs.map(String).includes(me)) item.joinRequests = [...reqs, me];
    await item.save();
    await notify(req, item.userId, {
      type: 'group_join_request',
      title: 'Nouvelle demande de groupe',
      body: `${req.userPseudo || 'Un utilisateur'} demande à rejoindre ${item.name || 'un groupe'}.`,
      data: { groupId: String(item._id) }
    });
    return res.json({ ...item.toObject(), joinRequested: true });
  }

  item.members = [...(Array.isArray(item.members) ? item.members : []), me];
  await item.save();
  res.json(item);
});

router.post('/:id/leave', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  const me = String(req.userId);
  // creator can't leave (keeps group manageable)
  if (isCreator(item, me)) return res.status(400).json({ error: 'Le créateur ne peut pas quitter son groupe' });
  item.members = (Array.isArray(item.members) ? item.members : []).filter(id => String(id) !== me);
  item.moderators = (Array.isArray(item.moderators) ? item.moderators : []).filter(id => String(id) !== me);
  await item.save();
  res.json(item);
});

// Approve/deny join request (creator/mod/admin)
router.post('/:id/requests/:userId/approve', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isMod(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

  const target = String(req.params.userId);
  item.joinRequests = (Array.isArray(item.joinRequests) ? item.joinRequests : []).filter(id => String(id) !== target);
  if (!isMember(item, target)) item.members = [...(Array.isArray(item.members) ? item.members : []), target];
  await item.save();
  await notify(req, target, {
    type: 'group_join_approved',
    title: 'Demande acceptée',
    body: `Vous avez été accepté dans le groupe ${item.name || ''}.`,
    data: { groupId: String(item._id) }
  });
  res.json(item);
});

router.post('/:id/requests/:userId/deny', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isMod(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

  const target = String(req.params.userId);
  item.joinRequests = (Array.isArray(item.joinRequests) ? item.joinRequests : []).filter(id => String(id) !== target);
  await item.save();
  await notify(req, target, {
    type: 'group_join_denied',
    title: 'Demande refusée',
    body: `Votre demande pour rejoindre ${item.name || ''} a été refusée.`,
    data: { groupId: String(item._id) }
  });
  res.json(item);
});

// Member management: remove / ban / unban
router.post('/:id/members/:userId/remove', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isMod(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const target = String(req.params.userId);
  if (isCreator(item, target)) return res.status(400).json({ error: 'Impossible de retirer le créateur' });
  item.members = (Array.isArray(item.members) ? item.members : []).filter(id => String(id) !== target);
  item.moderators = (Array.isArray(item.moderators) ? item.moderators : []).filter(id => String(id) !== target);
  await item.save();
  await notify(req, target, {
    type: 'group_removed',
    title: 'Retiré du groupe',
    body: `Vous avez été retiré du groupe ${item.name || ''}.`,
    data: { groupId: String(item._id) }
  });
  res.json(item);
});

router.post('/:id/members/:userId/ban', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isMod(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const target = String(req.params.userId);
  if (isCreator(item, target)) return res.status(400).json({ error: 'Impossible de bannir le créateur' });
  item.members = (Array.isArray(item.members) ? item.members : []).filter(id => String(id) !== target);
  item.joinRequests = (Array.isArray(item.joinRequests) ? item.joinRequests : []).filter(id => String(id) !== target);
  if (!isBanned(item, target)) item.bannedMembers = [...(Array.isArray(item.bannedMembers) ? item.bannedMembers : []), target];
  item.moderators = (Array.isArray(item.moderators) ? item.moderators : []).filter(id => String(id) !== target);
  await item.save();
  await notify(req, target, {
    type: 'group_banned',
    title: 'Banni du groupe',
    body: `Vous avez été banni du groupe ${item.name || ''}.`,
    data: { groupId: String(item._id) }
  });
  res.json(item);
});

router.post('/:id/members/:userId/unban', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isMod(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const target = String(req.params.userId);
  item.bannedMembers = (Array.isArray(item.bannedMembers) ? item.bannedMembers : []).filter(id => String(id) !== target);
  await item.save();
  res.json(item);
});

// Moderators
router.post('/:id/moderators/:userId/promote', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isCreator(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const target = String(req.params.userId);
  if (!isMember(item, target)) return res.status(400).json({ error: 'L’utilisateur doit être membre' });
  const mods = Array.isArray(item.moderators) ? item.moderators : [];
  if (!mods.map(String).includes(target)) item.moderators = [...mods, target];
  await item.save();
  await notify(req, target, {
    type: 'group_promoted',
    title: 'Vous êtes modérateur',
    body: `Vous avez été nommé modérateur du groupe ${item.name || ''}.`,
    data: { groupId: String(item._id) }
  });
  res.json(item);
});

router.post('/:id/moderators/:userId/demote', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isCreator(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });
  const target = String(req.params.userId);
  item.moderators = (Array.isArray(item.moderators) ? item.moderators : []).filter(id => String(id) !== target);
  await item.save();
  res.json(item);
});

// Invites (creator/mod/admin)
router.post('/:id/invites', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (!isMod(item, req.userId) && req.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const userId = String(req.body?.userId || '').trim();
  if (!email && !userId) return res.status(400).json({ error: 'email ou userId requis' });

  let targetUser = null;
  if (userId) targetUser = await User.findById(userId);
  if (!targetUser && email) targetUser = await User.findOne({ email });

  const invite = {
    userId: targetUser ? String(targetUser._id) : '',
    email: targetUser ? String(targetUser.email) : email,
    status: 'pending',
    createdAt: new Date()
  };
  item.invites = [...(Array.isArray(item.invites) ? item.invites : []), invite];
  await item.save();

  if (targetUser) {
    await notify(req, String(targetUser._id), {
      type: 'group_invite',
      title: 'Invitation de groupe',
      body: `Vous êtes invité à rejoindre le groupe ${item.name || ''}.`,
      data: { groupId: String(item._id) }
    });
  }

  res.json(item);
});

router.post('/:id/invites/accept', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  const me = String(req.userId);
  if (isBanned(item, me)) return res.status(403).json({ error: 'Vous êtes banni de ce groupe' });

  const invites = Array.isArray(item.invites) ? item.invites : [];
  const found = invites.find(i => String(i.userId || '') === me || (i.email && String(i.email).toLowerCase() === String(req.userEmail || '').toLowerCase()));
  if (!found) return res.status(404).json({ error: 'Invitation non trouvée' });
  found.status = 'accepted';
  if (!isMember(item, me)) item.members = [...(Array.isArray(item.members) ? item.members : []), me];
  await item.save();
  await notify(req, item.userId, {
    type: 'group_invite_accepted',
    title: 'Invitation acceptée',
    body: `${req.userPseudo || 'Un utilisateur'} a rejoint ${item.name || ''}.`,
    data: { groupId: String(item._id) }
  });
  res.json(item);
});

// Group posts
router.get('/:id/posts', async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Non trouvé' });
  const posts = await GroupPost.find({ groupId: String(group._id) }).sort({ createdAt: -1 });
  res.json(posts);
});

router.post('/:id/posts', auth, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Non trouvé' });
  const me = String(req.userId);
  if (isBanned(group, me)) return res.status(403).json({ error: 'Vous êtes banni de ce groupe' });
  if (!isMember(group, me)) return res.status(403).json({ error: 'Rejoignez le groupe pour publier' });

  const content = String(req.body?.content || '').trim();
  const imageUrls = Array.isArray(req.body?.imageUrls) ? req.body.imageUrls.filter(Boolean).slice(0, 3) : [];
  const links = Array.isArray(req.body?.links) ? sanitizeLinks(req.body.links) : [];
  if (!content && imageUrls.length === 0 && links.length === 0) return res.status(400).json({ error: 'Contenu requis' });

  const post = await new GroupPost({
    groupId: String(group._id),
    userId: me,
    authorName: String(req.userPseudo || ''),
    content,
    imageUrls,
    links
  }).save();

  res.status(201).json(post);
});

router.post('/posts/:postId/like', auth, async (req, res) => {
  const post = await GroupPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Non trouvé' });
  const me = String(req.userId);
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const hasLiked = likes.map(String).includes(me);
  post.likes = hasLiked ? likes.filter(id => String(id) !== me) : [...likes, me];
  await post.save();
  res.json(post);
});

router.post('/posts/:postId/comments', auth, async (req, res) => {
  const post = await GroupPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Non trouvé' });
  const content = String(req.body?.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Message requis' });
  post.comments = [...(Array.isArray(post.comments) ? post.comments : []), {
    userId: String(req.userId),
    authorName: String(req.userPseudo || ''),
    content,
    createdAt: new Date()
  }];
  await post.save();
  res.json(post);
});

router.delete('/posts/:postId', auth, async (req, res) => {
  const post = await GroupPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Non trouvé' });
  const group = await Group.findById(post.groupId);
  const can = String(post.userId) === String(req.userId) || (group && (isMod(group, req.userId) || req.role === 'admin'));
  if (!can) return res.status(403).json({ error: 'Non autorisé' });
  await post.deleteOne();
  res.json({ message: 'Supprimé' });
});

router.put('/posts/:postId', auth, async (req, res) => {
  const post = await GroupPost.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Non trouvé' });
  const group = await Group.findById(post.groupId);
  const can = String(post.userId) === String(req.userId) || (group && (isMod(group, req.userId) || req.role === 'admin'));
  if (!can) return res.status(403).json({ error: 'Non autorisé' });

  const content = String(req.body?.content || '').trim();
  const imageUrls = Array.isArray(req.body?.imageUrls) ? req.body.imageUrls.filter(Boolean).slice(0, 3) : undefined;
  const links = Array.isArray(req.body?.links) ? sanitizeLinks(req.body.links) : undefined;
  if (!content && (!Array.isArray(imageUrls) || imageUrls.length === 0) && (!Array.isArray(links) || links.length === 0)) {
    return res.status(400).json({ error: 'Contenu requis' });
  }

  post.content = content;
  if (imageUrls !== undefined) post.imageUrls = imageUrls;
  if (links !== undefined) post.links = links;
  await post.save();
  res.json(post);
});

router.post('/:id/like', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });

  const me = String(req.userId);
  const likes = Array.isArray(item.likes) ? item.likes : [];
  const hasLiked = likes.includes(me);
  item.likes = hasLiked ? likes.filter(id => id !== me) : [...likes, me];
  await item.save();

  res.json(item);
});

router.delete('/:id', auth, async (req, res) => {
  const item = await Group.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Non trouvé' });
  if (
    String(item.userId) !== String(req.userId) &&
    req.role !== 'admin' &&
    req.role !== 'moderator'
  ) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  await GroupPost.deleteMany({ groupId: String(item._id) });
  await item.deleteOne();
  res.json({ message: 'Supprimé' });
});

module.exports = router;