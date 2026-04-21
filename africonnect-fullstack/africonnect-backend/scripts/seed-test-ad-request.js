/**
 * Insère une demande de publicité « à valider » (statut under_review) pour tests admin.
 * Usage (depuis africonnect-backend, avec .env chargé) :
 *   node scripts/seed-test-ad-request.js
 * Supprime d’abord les anciennes entrées seed (même userEmail).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const AdRequest = require('../models/AdRequest');

const SEED_EMAIL = 'seed-test-ad@africonnect.local';
const SEED_USER_ID = '000000000000000000000001';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Erreur: définissez MONGODB_URI dans .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  await AdRequest.deleteMany({ userEmail: SEED_EMAIL });

  const doc = await AdRequest.create({
    userId: SEED_USER_ID,
    userEmail: SEED_EMAIL,
    userPseudo: 'Test validation pub',
    option: 'publish_only',
    message:
      'Demande de test (script scripts/seed-test-ad-request.js). À approuver ou refuser depuis Admin → Demandes pub.',
    mediaUrl: 'https://picsum.photos/seed/africonnect-ad/800/450.jpg',
    status: 'under_review',
    paymentMethod: 'seed_test'
  });

  console.log('OK — demande créée:', doc._id.toString());
  console.log('Ouvrir: /admin/ad-requests — filtrer le statut « En révision » (under_review), puis Approuver pour publier dans le carrousel.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
